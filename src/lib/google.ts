import { google } from 'googleapis';

const spreadsheetId = process.env.GOOGLE_SHEET_ID || '11277-ct4QoUMSra1M9rg4cGabPvC6cWa';

export async function getGoogleSheetsClient() {
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;
  
  if (privateKey) {
    // 1. Trim whitespace
    privateKey = privateKey.trim();
    // 2. Remove surrounding quotes if they exist
    if ((privateKey.startsWith('"') && privateKey.endsWith('"')) || 
        (privateKey.startsWith("'") && privateKey.endsWith("'"))) {
      privateKey = privateKey.substring(1, privateKey.length - 1);
    }
    // 3. Replace literal \n with actual newlines
    privateKey = privateKey.replace(/\\n/g, '\n');
    // 4. Final trim
    privateKey = privateKey.trim();
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
