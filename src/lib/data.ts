import { getGoogleSheetsClient, spreadsheetId } from './google';

export interface User {
  業務員代碼: string;
  '驗證碼(生日後四碼)': string;
  區域中心: string;
  通訊處: string;
  姓名: string;
}

export interface Package {
  包序號: number;
  建議經營團隊人數: number;
  可選擇的區域中心: string;
  [key: string]: any;
}

export interface Member {
  業務員代碼: string;
  通訊處: string;
  姓名: string;
  職級: string;
}

export interface Registration {
  業務員代碼: string;
  通訊處: string;
  姓名: string;
  包序號: number;
  志願序: number;
  推動規劃: string;
  人員經營管理及跟催機制: string;
  經營目標: string;
  總召業務員代碼: string;
  團隊成員業務員代碼: string[];
  選擇時間: string;
}

/**
 * Fetches all source data from Google Sheets in one batch call
 */
export async function getExcelData() {
  const sheets = await getGoogleSheetsClient();
  
  // Batch get ranges
  const response = await sheets.spreadsheets.values.batchGet({
    spreadsheetId,
    ranges: ['登入!A:E', '分包資料!A:Z', '成員選擇!A:F'],
  });

  const valueRanges = response.data.valueRanges || [];
  
  const loginRows = valueRanges[0]?.values || [];
  const packageRows = valueRanges[1]?.values || [];
  const memberRows = valueRanges[2]?.values || [];

  const parseRows = (rows: any[][]) => {
    if (rows.length < 2) return [];
    const headers = rows[0];
    return rows.slice(1).map(row => {
      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header] = row[index];
      });
      return obj;
    });
  };

  return {
    loginData: parseRows(loginRows) as User[],
    packageData: parseRows(packageRows).map(p => ({ ...p, 包序號: parseInt(p.包序號), 建議經營團隊人數: parseInt(p.建議經營團隊人數) })) as Package[],
    memberData: parseRows(memberRows) as Member[],
  };
}

/**
 * Fetches registrations from the "報名結果" tab
 */
export async function getRegistrations(): Promise<Registration[]> {
  const sheets = await getGoogleSheetsClient();
  
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: '報名結果!A:K',
    });

    const rows = response.data.values;
    if (!rows || rows.length < 2) return [];

    const headers = rows[0];
    return rows.slice(1).map(row => {
      const obj: any = {};
      headers.forEach((header, index) => {
        if (header === '團隊成員業務員代碼') {
            obj[header] = row[index] ? row[index].split(',') : [];
        } else if (header === '包序號' || header === '志願序') {
            obj[header] = parseInt(row[index]);
        } else {
            obj[header] = row[index];
        }
      });
      return obj as Registration;
    });
  } catch (e) {
    // If sheet doesn't exist, return empty
    return [];
  }
}

/**
 * Appends a registration to the Google Sheet
 */
export async function saveRegistration(reg: Registration) {
  const sheets = await getGoogleSheetsClient();

  const values = [
    [
      reg.業務員代碼,
      reg.通訊處,
      reg.姓名,
      reg.包序號,
      reg.志願序,
      reg.推動規劃,
      reg.人員經營管理及跟催機制,
      reg.經營目標,
      reg.總召業務員代碼,
      reg.團隊成員業務員代碼.join(','),
      reg.選擇時間
    ]
  ];

  // Try to append. If it fails (e.g. sheet doesn't exist), we might need to create it first.
  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: '報名結果!A1',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values },
    });
  } catch (error: any) {
    if (error.message.includes('not found')) {
        // Create sheet and headers
        await createResultsSheet(sheets);
        await saveRegistration(reg); // Retry
    } else {
        throw error;
    }
  }
}

async function createResultsSheet(sheets: any) {
    await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
            requests: [
                {
                    addSheet: {
                        properties: { title: '報名結果' }
                    }
                }
            ]
        }
    });
    
    const headers = [
        ['業務員代碼', '通訊處', '姓名', '包序號', '志願序', '推動規劃', '人員經營管理及跟催機制', '經營目標', '總召業務員代碼', '團隊成員業務員代碼', '選擇時間']
    ];
    
    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: '報名結果!A1',
        valueInputOption: 'RAW',
        requestBody: { values: headers }
    });
}

export async function clearUserRegistrations(salesCode: string) {
    // Note: Deleting rows in Google Sheets is complex. 
    // For this simple survey, we'll allow multiple entries or just keep appending and the "latest" wins in stats.
    // Or we could fetch everything, filter, and overwrite. 
    // Overwriting a whole sheet is safer for small counts.
    
    const regs = await getRegistrations();
    const filtered = regs.filter(r => r.業務員代碼 !== salesCode);
    
    const sheets = await getGoogleSheetsClient();
    const headers = [['業務員代碼', '通訊處', '姓名', '包序號', '志願序', '推動規劃', '人員經營管理及跟催機制', '經營目標', '總召業務員代碼', '團隊成員業務員代碼', '選擇時間']];
    const values = filtered.map(r => [
        r.業務員代碼, r.通訊處, r.姓名, r.包序號, r.志願序, r.推動規劃, r.人員經營管理及跟催機制, r.經營目標, r.總召業務員代碼, r.團隊成員業務員代碼.join(','), r.選擇時間
    ]);

    await sheets.spreadsheets.values.clear({ spreadsheetId, range: '報名結果!A:K' });
    await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: '報名結果!A1',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [...headers, ...values] }
    });
}
