import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    // Verify cron secret (optional security)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      console.error('Telegram credentials not configured');
      return NextResponse.json({ 
        error: 'Telegram not configured',
        message: 'Add TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID to environment variables' 
      }, { status: 500 });
    }

    // Get all phrases from Firebase
    const phrasesRef = collection(db, 'phrases');
    const snapshot = await getDocs(phrasesRef);

    const allPhrases = snapshot.docs
      .filter(doc => !doc.data().deleted)
      .map(doc => ({
        id: doc.id,
        text: doc.data().text,
      }));

    if (allPhrases.length === 0) {
      return NextResponse.json({ 
        error: 'No phrases found',
        message: 'Database is empty' 
      }, { status: 404 });
    }

    // Get 10 random phrases
    const shuffled = allPhrases.sort(() => 0.5 - Math.random());
    const randomPhrases = shuffled.slice(0, 10);

    // Format message
    let message = '😄 *Daily Funny Phrases*\n\n';
    randomPhrases.forEach((phrase, index) => {
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
        message: 'Daily phrases sent to Telegram',
        phrasesCount: randomPhrases.length,
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
    console.error('Error in send-daily-phrases:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

