// app/api/send-onboarding-message/route.ts
import { NextResponse } from 'next/server';

const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID!;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN!;

export async function POST(req: Request) {
  const body = await req.json();
  const to_number = body.to_number;

  const url = `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`;

  const headers = {
    Authorization: `Bearer ${WHATSAPP_TOKEN}`,
    'Content-Type': 'application/json',
  };

  const payload = {
    messaging_product: 'whatsapp',
    to: to_number,
    type: 'template',
    template: {
      name: 'fitchat_welcome',
      language: {
        code: 'en',
      },
    },
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    console.log('📤 Onboarding status:', res.status);
    console.log('📤 Onboarding response:', data);

    return NextResponse.json(data, { status: res.status });
} catch (error: unknown) {
  if (error instanceof Error) {
    console.error('⚠️ Onboarding error:', error.message);
  } else {
    console.error('⚠️ Unknown error:', error);
  }
    return NextResponse.json(
      { error: 'Failed to send onboarding message' },
      { status: 500 }
    );
  }
}