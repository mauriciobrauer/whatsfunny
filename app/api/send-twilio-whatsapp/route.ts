import { NextResponse } from 'next/server';
import { Twilio } from 'twilio';

export async function POST(request: Request) {
  try {
    const { phrases } = await request.json();

    if (!phrases || !Array.isArray(phrases) || phrases.length === 0) {
      return NextResponse.json({ error: 'No phrases provided' }, { status: 400 });
    }

    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioWhatsAppNumber = process.env.TWILIO_WHATSAPP_NUMBER;
    const twilioToNumber = process.env.TWILIO_TO_NUMBER;

    if (!twilioAccountSid || !twilioAuthToken || !twilioWhatsAppNumber || !twilioToNumber) {
      return NextResponse.json({ 
        error: 'Twilio not configured',
        message: 'Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_NUMBER, and TWILIO_TO_NUMBER to environment variables' 
      }, { status: 500 });
    }

    // Initialize Twilio client
    const client = new Twilio(twilioAccountSid, twilioAuthToken);

    // Format phrases for template variables
    const phrasesText = phrases.map((phrase: any, index: number) => 
      `${index + 1}. ${phrase.text}`
    ).join('\n');

    // Send to WhatsApp via Twilio using template
    console.log('Sending template message:', {
      from: twilioWhatsAppNumber,
      to: twilioToNumber,
      contentSid: 'HXb5b62575e6e4ff6129ad7c8efe1f983e',
      contentVariables: { "1": phrasesText, "2": new Date().toLocaleDateString() }
    });
    
    const message = await client.messages.create({
      from: twilioWhatsAppNumber,
      to: twilioToNumber,
      contentSid: 'HXb5b62575e6e4ff6129ad7c8efe1f983e',
      contentVariables: {
        "1": phrasesText,
        "2": new Date().toLocaleDateString()
      }
    });
    
    console.log('Message sent successfully:', message.sid, message.status);

    return NextResponse.json({
      success: true,
      message: 'Phrases sent to WhatsApp via Twilio successfully!',
      phrasesCount: phrases.length,
      twilioMessageSid: message.sid,
      twilioResponse: {
        sid: message.sid,
        status: message.status,
        to: message.to,
        from: message.from
      }
    });

  } catch (error) {
    console.error('Error sending phrases to WhatsApp via Twilio:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
