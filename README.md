# Telegram Message Fetcher

A Node.js tool to fetch and save all messages from a specific user in a Telegram channel or group.

## Features

- 🔍 Search messages by username
- 📊 Real-time progress tracking
- 💾 Save messages to text file
- 🔄 Auto-retry on connection issues
- 📱 Session string support for persistent login

## Prerequisites

- Node.js (v12 or higher)
- Telegram API credentials (API_ID and API_HASH)
- Channel/Group membership where you want to search

## Installation

1. Clone the repository:

```bash
git clone https://github.com/mesamirh/find-telegram-user-massges.git
cd find-telegram-user-massges
```

2. Install dependencies:

```bash
npm install
```

3. Configure environment variables:

```bash
cp .env.example .env
```

4. Update `.env` with your credentials:

```properties
API_ID=your_api_id_here
API_HASH="your_api_hash_here"
SESSION_STRING=""
TARGET_USERNAME="target_username_here"
CHAT_ID=your_chat_id_here
```

## Usage

Run the script:

```bash
node main.js
```

The script will:

1. Connect to Telegram
2. Scan all messages in the specified channel/group
3. Save messages from the target user to a text file

## Output

Messages are saved to `{TARGET_USERNAME}_messages.txt` with the following format:

```
📅 Date: [timestamp]
📌 Message ID: [id]
💬 Text: [message content]
────────────────────────────────
```

## Environment Variables

- `API_ID`: Your Telegram API ID
- `API_HASH`: Your Telegram API hash
- `SESSION_STRING`: Session string for persistent login (optional)
- `TARGET_USERNAME`: Username to search for
- `CHAT_ID`: Channel/Group ID (must start with -100 for supergroups)

## Notes

- First-time usage requires authentication with your phone number
- Save the session string for future use to avoid re-authentication
- Ensure you have proper permissions in the target channel/group
