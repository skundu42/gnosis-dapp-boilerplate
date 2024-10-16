import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const apiBaseUrl = 'https://nanoshutter.staging.shutter.network';

export async function POST(req: NextRequest) {
  const { type, message, timestamp, encryptedMsg } = await req.json();

  try {
    if (type === 'encrypt') {
      const response = await axios.post(`${apiBaseUrl}/encrypt/with_time`, {
        cypher_text: message,
        timestamp: timestamp,
      });
      return NextResponse.json({ encryptedMessage: response.data.message });
    }

    if (type === 'decrypt') {
      const response = await axios.post(`${apiBaseUrl}/decrypt/with_time`, {
        encrypted_msg: encryptedMsg,
        timestamp: timestamp,
      });
      return NextResponse.json({ decryptedMessage: response.data.message });
    }

    return NextResponse.json({ error: 'Invalid request type' }, { status: 400 });
  } catch (error) {
    console.error('Error in API route:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
