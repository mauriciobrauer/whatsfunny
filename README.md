# What's Funny 😄

A Next.js application for sharing and enjoying funny phrases, with Firebase integration and daily Telegram notifications.

## Features

- 🎲 Display 10 random funny phrases from Firebase Firestore
- ✏️ Add new funny phrases via a simple text input
- 📊 Automatic saving to Google Sheets (optional)
- 📱 Daily Telegram notifications with 10 random phrases
- 🎨 Beautiful, modern UI with Tailwind CSS
- 🌙 Dark mode support

## Tech Stack

- **Next.js 15** with App Router
- **TypeScript** (strict mode)
- **Tailwind CSS** for styling
- **Firebase Firestore** for database
- **Firebase Functions** for scheduled tasks
- **Google Sheets API** for spreadsheet integration
- **Telegram Bot API** for notifications

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Firebase project
- (Optional) Google Service Account for Sheets integration
- (Optional) Telegram Bot Token for notifications

### Installation

1. Clone the repository and install dependencies:

```bash
npm install
```

2. Configure environment variables:

Create a `.env.local` file in the root directory:

```env
# Google Sheets Configuration (optional)
GOOGLE_SPREADSHEET_ID=your_spreadsheet_id
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}

# Telegram Bot Configuration (optional)
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
```

3. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Firebase Functions Setup

### Deploy Functions

1. Navigate to the functions directory:

```bash
cd firebase-functions
npm install
```

2. Set environment variables for Firebase Functions:

```bash
firebase functions:config:set telegram.bot_token="YOUR_BOT_TOKEN"
firebase functions:config:set telegram.chat_id="YOUR_CHAT_ID"
```

3. Deploy the functions:

```bash
firebase deploy --only functions
```

### Functions Available

- **sendDailyPhrases**: Scheduled function that runs daily at 9 AM, sending 10 random phrases to Telegram
- **sendPhrasesNow**: HTTP function for manually triggering phrase sending (useful for testing)

## Google Sheets Integration

To enable Google Sheets integration:

1. Create a Google Cloud Project
2. Enable the Google Sheets API
3. Create a Service Account and download the JSON key
4. Share your spreadsheet with the service account email
5. Add the credentials to your `.env.local` file

The app will automatically append new phrases to the spreadsheet with timestamp.

## Telegram Bot Setup

1. Create a new bot with [@BotFather](https://t.me/botfather) on Telegram
2. Get your bot token
3. Get your chat ID (you can use [@userinfobot](https://t.me/userinfobot))
4. Add both to your environment variables

## Project Structure

```
DiarioDeComedia/
├── app/
│   ├── api/
│   │   └── phrases/
│   │       └── route.ts          # API routes for phrases
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Main page
├── firebase-functions/
│   └── src/
│       └── index.ts              # Firebase Functions
├── lib/
│   └── firebase.ts               # Firebase configuration
├── firebase.json                 # Firebase config
├── package.json
└── README.md
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## License

MIT

