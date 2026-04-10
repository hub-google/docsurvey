import { google } from 'googleapis';

const spreadsheetId = process.env.GOOGLE_SHEET_ID || '11277-ct4QoUMSra1M9rg4cGabPvC6cWa';

export async function getGoogleSheetsClient() {
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;
  
  if (privateKey) {
    // 1. Handle double-quoted string from env vars (common in Netlify/Docker)
    privateKey = privateKey.trim();
    if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
      privateKey = privateKey.slice(1, -1);
    }
    if (privateKey.startsWith("'") && privateKey.endsWith("'")) {
      privateKey = privateKey.slice(1, -1);
    }

    // 2. Handle literal \n or escaped \\n
    privateKey = privateKey.replace(/\\n/g, '\n').replace(/\\n/g, '\n');

    // 3. If it looks like a JSON object (user might have pasted the whole service account JSON)
    if (privateKey.startsWith('{') && privateKey.includes('private_key')) {
      try {
        const json = JSON.parse(privateKey);
        privateKey = json.private_key || privateKey;
      } catch (e) {
        // Not JSON, continue
      }
    }

    // 4. Ensure it has the correct PEM headers/footers
    const header = '-----BEGIN PRIVATE KEY-----';
    const footer = '-----END PRIVATE KEY-----';
    
    if (!privateKey.includes(header)) {
      // If it doesn't have the header, it might just be the base64 part.
      // We'll try to wrap it, but this is a last resort.
      privateKey = `${header}\n${privateKey}\n${footer}`;
    }
    
    // 5. Final cleanup of any potential trailing spaces on multi-line keys
    privateKey = privateKey.split('\n').map(line => line.trim()).join('\n').trim();
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return google.sheets({ version: 'v4', auth });
}

export { spreadsheetId };
