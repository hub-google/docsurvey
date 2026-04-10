import { google } from 'googleapis';

const spreadsheetId = process.env.GOOGLE_SHEET_ID || '11277-ct4QoUMSra1M9rg4cGabPvC6cWa';

export async function getGoogleSheetsClient() {
  const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  let credentials;

  if (serviceAccountJson) {
    try {
      credentials = JSON.parse(serviceAccountJson);
    } catch (e) {
      console.error('Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON');
    }
  }

  if (!credentials) {
    const envKey = process.env.GOOGLE_PRIVATE_KEY;
    const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;

    if (!envKey || !clientEmail) {
      throw new Error('Missing Google credentials. Please set GOOGLE_SERVICE_ACCOUNT_JSON or both GOOGLE_PRIVATE_KEY and GOOGLE_CLIENT_EMAIL.');
    }

    // Fallback to manual parsing if JSON is not provided
    let key = envKey.trim()
      .replace(/^["'](.*)["']$/, '$1')
      .replace(/\\n/g, '\n')
      .replace(/\r/n/g, '\n');

    const header = '-----BEGIN PRIVATE KEY-----';
    const footer = '-----END PRIVATE KEY-----';
    
    if (!key.includes('BEGIN PRIVATE KEY')) {
      key = `${header}\n${key}\n${footer}`;
    }

    credentials = {
      client_email: clientEmail,
      private_key: key,
    };
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return google.sheets({ version: 'v4', auth });
}

export { spreadsheetId };
