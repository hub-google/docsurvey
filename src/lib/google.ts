import { google } from 'googleapis';

const spreadsheetId = process.env.GOOGLE_SHEET_ID || '11277-ct4QoUMSra1M9rg4cGabPvC6cWa';

export async function getGoogleSheetsClient() {
  const envKey = process.env.GOOGLE_PRIVATE_KEY;
  
  if (!envKey) {
    throw new Error('Missing GOOGLE_PRIVATE_KEY environment variable. Please add it to Netlify site settings.');
  }

  // Use a local string variable to satisfy TypeScript throughout the function
  let key: string = envKey;

  // 1. Handle double-quoted string from env vars (common in Netlify/Docker)
  key = key.trim();
  if (key.startsWith('"') && key.endsWith('"')) {
    key = key.slice(1, -1);
  }
  if (key.startsWith("'") && key.endsWith("'")) {
    key = key.slice(1, -1);
  }

  // 2. Handle literal \n or escaped \\n
  key = key.replace(/\\n/g, '\n').replace(/\\n/g, '\n');

  // 3. If it looks like a JSON object (user might have pasted the whole service account JSON)
  if (key.startsWith('{') && key.includes('private_key')) {
    try {
      const json = JSON.parse(key);
      if (json.private_key) {
        key = json.private_key;
      }
    } catch (e) {
      // Not JSON, continue
    }
  }

  // 4. Ensure it has the correct PEM headers/footers
  const header = '-----BEGIN PRIVATE KEY-----';
  const footer = '-----END PRIVATE KEY-----';
  
  if (!key.includes(header)) {
    // If it doesn't have the header, it might just be the base64 part.
    key = `${header}\n${key}\n${footer}`;
  }
  
  // 5. Final cleanup of any potential trailing spaces on multi-line keys
  key = key.split('\n').map(line => line.trim()).join('\n').trim();

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: key,
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return google.sheets({ version: 'v4', auth });
}

export { spreadsheetId };
