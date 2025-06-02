//=============== gSheet 內嵌 gs =======================
// gs 管理修改部署需要選"建立新版本",才會更新應用。

const SPREADSHEET_ID = '1DZbJEi3lDsnOO2uA9dUDNYoyUYvGi8ULOJVGkfyzy88'; 
const SHEET_NAME = '訂單表'; 


// doPost =================
function doPost(e) {
  // 使用 LockService 防止同時有多個請求寫入導致衝突
  const lock = LockService.getScriptLock();

  try {
    lock.waitLock(30000); // 等待最多 30 秒以獲取鎖定

    let requestData = JSON.parse(e.postData.contents);

    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  
    //debug 用
    const sheetLog = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName("除錯表");
    sheetLog.getRange("A2").setValue("貓5");
    sheetLog.getRange("B2").setValue(requestData);


    // 若為單筆，轉為陣列
    if (!Array.isArray(requestData)) requestData = [requestData];

    if (requestData.length === 0) {
      throw new Error("資料為空");
    }

    // 取得表頭第 5 列
    const rawHeaders = sheet.getRange(5, 1, 1, sheet.getLastColumn()).getValues()[0];
    const headers = rawHeaders.filter(h => h !== "");

    // 將每筆資料轉換為表頭順序的一維陣列
    const rowsToInsert = requestData.map(item => {
      return headers.map(header => item[header] ?? ""); // undefined/null 都轉為空字串
    });

    const numRows = rowsToInsert.length;
    const numCols = headers.length;

    // 插入空列於第 6 列
    sheet.insertRowsBefore(6, numRows);
    sheet.getRange(6, 1, numRows, numCols).setValues(rowsToInsert);


    // 返回成功響應給前端
    return ContentService.createTextOutput(JSON.stringify({ 
      status: 'success', 
      message: '資料寫入成功！', 
      //writtenData: requestData, // 返回寫入的資料以供前端確認
      writtenData: rowsToInsert // 返回寫入的資料以供前端確認
    }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    // 返回錯誤響應給前端
    return ContentService.createTextOutput(JSON.stringify({ 
      status: 'error', 
      message: error.message || '發生未知錯誤' 
    })).setMimeType(ContentService.MimeType.JSON);

  }finally {
    // 釋放鎖定
    lock.releaseLock();
  }
}

