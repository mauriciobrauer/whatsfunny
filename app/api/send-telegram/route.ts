import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { phrases } = await request.json();

    if (!phrases || !Array.isArray(phrases) || phrases.length === 0) {
      return NextResponse.json({ error: 'No phrases provided' }, { status: 400 });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      return NextResponse.json({ 
        error: 'Telegram not configured',
        message: 'Add TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID to environment variables' 
      }, { status: 500 });
    }

    // Format message
    let message = '😄 *Current Funny Phrases*\n\n';
    phrases.forEach((phrase: any, index: number) => {
      message += `${index + 1}. ${phrase.text}\n\n`;
    });
    message += '---\n_From What\'s funny?_';

    // Send to Telegram
    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const telegramResponse = await fetch(telegramUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
      }),
    });

    const result = await telegramResponse.json();

    if (telegramResponse.ok) {
      return NextResponse.json({
        success: true,
        message: 'Phrases sent to Telegram successfully!',
        phrasesCount: phrases.length,
        telegramResponse: result
      });
    } else {
      console.error('Telegram API error:', result);
      return NextResponse.json({
        error: 'Failed to send to Telegram',
        details: result
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error sending phrases to Telegram:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
