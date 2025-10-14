import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import fetch from 'node-fetch';

admin.initializeApp();

// Scheduled function to send 10 random phrases to Telegram daily at 9 AM
export const sendDailyPhrases = functions.pubsub
  .schedule('0 9 * * *') // Every day at 9:00 AM
  .timeZone('America/Mexico_City') // Adjust timezone as needed
  .onRun(async (context) => {
    try {
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      const chatId = process.env.TELEGRAM_CHAT_ID;

      if (!botToken || !chatId) {
        console.error('Telegram configuration missing');
        return null;
      }

      // Get all phrases from Firestore
      const phrasesSnapshot = await admin.firestore().collection('phrases').get();
      
      if (phrasesSnapshot.empty) {
        console.log('No phrases found in database');
        return null;
      }

      const allPhrases = phrasesSnapshot.docs.map(doc => ({
        id: doc.id,
        text: doc.data().text,
      }));

      // Get 10 random phrases
      const shuffled = allPhrases.sort(() => 0.5 - Math.random());
      const randomPhrases = shuffled.slice(0, 10);

      // Format message
      let message = '😄 *Daily Funny Phrases*\n\n';
      randomPhrases.forEach((phrase, index) => {
        message += `${index + 1}. ${phrase.text}\n\n`;
      });
      message += '---\nFrom What\'s Funny App';

      // Send to Telegram
      const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
      const response = await fetch(telegramUrl, {
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

      const result = await response.json();
      
      if (response.ok) {
        console.log('Successfully sent daily phrases to Telegram');
      } else {
        console.error('Error sending to Telegram:', result);
      }

      return null;
    } catch (error) {
      console.error('Error in sendDailyPhrases:', error);
      return null;
    }
  });

// HTTP function to manually trigger sending phrases (for testing)
export const sendPhrasesNow = functions.https.onRequest(async (req, res) => {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!botToken || !chatId) {
      res.status(500).send('Telegram configuration missing');
      return;
    }

    const phrasesSnapshot = await admin.firestore().collection('phrases').get();
    
    if (phrasesSnapshot.empty) {
      res.status(404).send('No phrases found');
      return;
    }

    const allPhrases = phrasesSnapshot.docs.map(doc => ({
      id: doc.id,
      text: doc.data().text,
    }));

    const shuffled = allPhrases.sort(() => 0.5 - Math.random());
    const randomPhrases = shuffled.slice(0, 10);

    let message = '😄 *Daily Funny Phrases*\n\n';
    randomPhrases.forEach((phrase, index) => {
      message += `${index + 1}. ${phrase.text}\n\n`;
    });
    message += '---\nFrom What\'s Funny App';

    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(telegramUrl, {
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

    const result = await response.json();
    
    if (response.ok) {
      res.json({ success: true, message: 'Phrases sent to Telegram' });
    } else {
      res.status(500).json({ error: 'Failed to send to Telegram', details: result });
    }
  } catch (error) {
    console.error('Error in sendPhrasesNow:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

