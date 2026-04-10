import { google } from 'googleapis';

const spreadsheetId = process.env.GOOGLE_SHEET_ID || '11277-ct4QoUMSra1M9rg4cGabPvC6cWa';

export async function getGoogleSheetsClient() {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY
    ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n').replace(/^["'](.*)["']$/, '$1')
    : undefined;

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
