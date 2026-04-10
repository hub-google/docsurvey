// Migration to GAS Bridge
const GAS_URL = process.env.NEXT_PUBLIC_GAS_WEBAPP_URL || '';
const SECRET_TOKEN = process.env.NEXT_PUBLIC_GAS_SECRET_TOKEN || 'Antigravity_2026';

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
 * Fetches all source data from Google Sheets via GAS Bridge
 */
export async function getExcelData(): Promise<{
  loginData: User[];
  packageData: Package[];
  memberData: Member[];
  registrations: Registration[];
}> {
  // Add timestamp to bypass any intermediate caches
  const timestamp = Date.now();
  const res = await fetch(`${GAS_URL}?action=getData&token=${SECRET_TOKEN}&_t=${timestamp}`, {
    method: 'GET',
    cache: 'no-store', // Next.js: do not cache this request
    headers: { 
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    }
  });
  
  if (!res.ok) throw new Error('GAS Bridge Error: Failed to fetch data');
  
  const data = await res.json();

  return {
    loginData: data.loginData as User[],
    packageData: data.packageData.map((p: any) => ({ 
      ...p, 
      包序號: parseInt(p.包序號), 
      建議經營團隊人數: parseInt(p.建議經營團隊人數) 
    })) as Package[],
    memberData: data.memberData as Member[],
    registrations: data.registrations as Registration[],
  };
}

/**
 * Saves registrations via GAS Bridge
 */
export async function saveRegistration(reg: Registration) {
    // This is now handled in a batch within saveAllSelections to be more efficient
}

export async function clearUserRegistrations(salesCode: string) {
    // This is handled as part of the saveAllSelections transaction in GAS
}

/**
 * Batch save all selections for a user
 */
export async function saveAllSelections(salesCode: string, selections: any[]) {
    const res = await fetch(GAS_URL, {
        method: 'POST',
        body: JSON.stringify({
            token: SECRET_TOKEN,
            action: 'saveRegistration',
            salesCode,
            selections: selections.map(s => ({
                業務員代碼: s.業務員代碼,
                通訊處: s.通訊處,
                姓名: s.姓名,
                包序號: s.packageId,
                志願序: s.priority,
                推動規劃: s.promoPlan,
                人員經營管理及跟催機制: s.mgmtMechanism,
                經營目標: s.target,
                總召業務員代碼: s.convener,
                團隊成員業務員代碼: s.teamMembers.join(','),
                選擇時間: new Date().toISOString()
            }))
        })
    });
    
    if (!res.ok) throw new Error('GAS Bridge Error: Failed to save registrations');
    return await res.json();
}
