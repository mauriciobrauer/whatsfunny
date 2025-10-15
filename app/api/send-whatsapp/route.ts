import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { phrases } = await request.json();

    if (!phrases || !Array.isArray(phrases) || phrases.length === 0) {
      return NextResponse.json({ error: 'No phrases provided' }, { status: 400 });
    }

    const whatsappAccessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const whatsappPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const whatsappToNumber = process.env.WHATSAPP_TO_NUMBER;

    if (!whatsappAccessToken || !whatsappPhoneNumberId || !whatsappToNumber) {
      return NextResponse.json({ 
        error: 'WhatsApp not configured',
        message: 'Add WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID, and WHATSAPP_TO_NUMBER to environment variables' 
      }, { status: 500 });
    }

    // Format message for WhatsApp (plain text, no markdown)
    let messageText = '😄 Funny Phrases\n\n';
    phrases.forEach((phrase: any, index: number) => {
      messageText += `${index + 1}. ${phrase.text}\n\n`;
    });
    messageText += '---\nFrom What\'s funny?';

    // Send to WhatsApp using template (more reliable)
    const whatsappUrl = `https://graph.facebook.com/v22.0/${whatsappPhoneNumberId}/messages`;
    const whatsappResponse = await fetch(whatsappUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${whatsappAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: whatsappToNumber,
        type: 'template',
        template: {
          name: 'hello_world',
          language: {
            code: 'en_US'
          }
        }
      }),
    });

    const result = await whatsappResponse.json();

    if (whatsappResponse.ok) {
      return NextResponse.json({
        success: true,
        message: 'Phrases sent to WhatsApp successfully!',
        phrasesCount: phrases.length,
        whatsappResponse: result
      });
    } else {
      console.error('WhatsApp API error:', result);
      return NextResponse.json({
        error: 'Failed to send to WhatsApp',
        details: result
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error sending phrases to WhatsApp:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
