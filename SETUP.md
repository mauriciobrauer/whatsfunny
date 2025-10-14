# Setup Guide for What's Funny

## 🚀 Quick Start

The application is now running on **http://localhost:3000**

## 📝 Configuration Steps

### 1. Google Sheets Integration (Optional)

To save phrases to Google Sheets:

1. **Create a Google Service Account:**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or select existing
   - Enable the Google Sheets API
   - Go to "Credentials" → "Create Credentials" → "Service Account"
   - Download the JSON key file

2. **Prepare your spreadsheet:**
   - Create a Google Sheet (or use existing)
   - Share it with the service account email (found in the JSON file)
   - Copy the Spreadsheet ID from the URL (the long string between `/d/` and `/edit`)

3. **Add to .env.local:**
   ```
   GOOGLE_SPREADSHEET_ID=your_spreadsheet_id_here
   GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"..."}
   ```

### 2. Telegram Bot Setup (Optional)

To receive daily phrases via Telegram:

1. **Create a Telegram Bot:**
   - Open Telegram and search for [@BotFather](https://t.me/botfather)
   - Send `/newbot` and follow instructions
   - Save the bot token you receive

2. **Get your Chat ID:**
   - Search for [@userinfobot](https://t.me/userinfobot) on Telegram
   - Start a conversation to get your chat ID
   - OR send a message to your bot and visit:
     ```
     https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
     ```

3. **Add to .env.local:**
   ```
   TELEGRAM_BOT_TOKEN=your_bot_token_here
   TELEGRAM_CHAT_ID=your_chat_id_here
   ```

### 3. Deploy Firebase Functions

To enable the daily cron job:

1. **Install Firebase CLI:**
   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase:**
   ```bash
   firebase login
   ```

3. **Initialize Firebase:**
   ```bash
   firebase init
   ```
   - Select your existing project: `diariodecomedia-bb577`
   - Select Functions
   - Use existing code in `firebase-functions/`

4. **Set environment variables:**
   ```bash
   firebase functions:config:set telegram.bot_token="YOUR_BOT_TOKEN"
   firebase functions:config:set telegram.chat_id="YOUR_CHAT_ID"
   ```

5. **Deploy functions:**
   ```bash
   firebase deploy --only functions
   ```

6. **Functions deployed:**
   - `sendDailyPhrases`: Runs daily at 9 AM
   - `sendPhrasesNow`: HTTP endpoint for manual testing

### 4. Test the Application

1. **Add a phrase:**
   - Open http://localhost:3000
   - Type a funny phrase in the text box
   - Click "Add"
   - The phrase will be saved to Firebase (and Google Sheets if configured)

2. **Test Telegram integration:**
   - Deploy the Firebase Functions
   - Visit the `sendPhrasesNow` function URL to test immediately
   - Or wait for the daily scheduled run at 9 AM

## 🔒 Environment Variables Summary

Create a `.env.local` file in the project root:

```env
# Optional: Google Sheets Integration
GOOGLE_SPREADSHEET_ID=
GOOGLE_SERVICE_ACCOUNT_KEY=

# Optional: Telegram Integration
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

## 📁 When you have the Google Spreadsheet URL

Just provide the spreadsheet URL, and I'll extract the ID and help you configure it!

## 🎯 Next Steps

1. ✅ Application is running on http://localhost:3000
2. ⬜ Add Google Sheets credentials (when ready)
3. ⬜ Configure Telegram bot (when ready)
4. ⬜ Deploy Firebase Functions for daily notifications

## 🆘 Troubleshooting

- **Application not loading?** Check if port 3000 is available
- **Firebase errors?** Verify Firebase credentials in `lib/firebase.ts`
- **Google Sheets not working?** Ensure the service account has access to the spreadsheet
- **Telegram not sending?** Verify bot token and chat ID are correct

## 📞 Support

If you need help with any configuration step, just ask!

