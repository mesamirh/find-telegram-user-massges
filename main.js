require("dotenv").config();
const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const fs = require("fs");
const readline = require("readline");

const apiId = parseInt(process.env.API_ID);
const apiHash = process.env.API_HASH;
const SESSION_STRING = process.env.SESSION_STRING;
const TARGET_USERNAME = process.env.TARGET_USERNAME;
const CHAT_ID = parseInt(process.env.CHAT_ID);

const stringSession = new StringSession(SESSION_STRING);
const client = new TelegramClient(stringSession, apiId, apiHash, {
  connectionRetries: 5,
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function resolveChannel(client, channelId) {
  try {
    const entity = await client.getEntity(channelId);
    if (!entity) {
      throw new Error("Could not resolve channel");
    }
    return channelId;
  } catch (error) {
    console.error("❌ Error resolving channel:", error.message);
    console.log("⚠️  Make sure:");
    console.log(
      "   1. The CHAT_ID format is correct (-100 prefix for supergroups)"
    );
    console.log("   2. You are a member of the channel/group");
    console.log("   3. The channel/group is accessible");
    throw error;
  }
}

async function getChannelMessages(
  client,
  channelId,
  limit = 100,
  offsetId = 0
) {
  try {
    return await client.getMessages(channelId, {
      limit: limit,
      offsetId: offsetId,
    });
  } catch (error) {
    console.error("Error fetching messages:", error.message);
    return [];
  }
}

async function getAllUserMessages() {
  try {
    console.clear();
    console.log("🤖 Telegram Message Fetcher\n");

    if (!SESSION_STRING) {
      console.log("📱 First time login - Authentication required\n");
      await client.start({
        phoneNumber: async () =>
          await new Promise((resolve) =>
            rl.question("📞 Enter your phone number: ", resolve)
          ),
        password: async () =>
          await new Promise((resolve) =>
            rl.question("🔐 Enter your 2FA password (if enabled): ", resolve)
          ),
        phoneCode: async () =>
          await new Promise((resolve) =>
            rl.question("✉️  Enter the verification code: ", resolve)
          ),
        onError: (err) => console.log("❌ Error:", err),
      });
      console.log("\n✨ Save this session string for future use:");
      console.log("📝", client.session.save());
    } else {
      console.log("🔄 Connecting to Telegram...");
      await client.connect();
      console.log("✅ Connected successfully!\n");
    }

    console.log("🔍 Resolving channel...");
    const channel = await resolveChannel(client, CHAT_ID);
    console.log("✅ Channel found!\n");

    const outputFile = `${TARGET_USERNAME}_messages.txt`;
    let messageCount = 0;
    let totalMessages = 0;
    let allMessages = [];
    const BATCH_SIZE = 100;
    let offsetId = 0;

    // Initial message count
    console.log("📊 Getting initial message count...");
    const initialBatch = await getChannelMessages(client, channel, 1);
    if (initialBatch.length > 0) {
      totalMessages = initialBatch[0].id;
    }

    console.log(`🎯 Target User: @${TARGET_USERNAME}`);
    console.log(
      `📩 Total messages to scan: ${totalMessages.toLocaleString()}\n`
    );

    const startTime = Date.now();

    while (true) {
      try {
        const messages = await getChannelMessages(
          client,
          channel,
          BATCH_SIZE,
          offsetId
        );

        if (messages.length === 0) break;

        const userMessages = messages.filter(
          (msg) =>
            msg.sender &&
            msg.sender.username &&
            msg.sender.username.toLowerCase() ===
              TARGET_USERNAME.toLowerCase().replace("@", "")
        );

        userMessages.forEach((msg) => {
          const messageDate = new Date(msg.date * 1000).toISOString();
          const messageData = {
            date: messageDate,
            messageId: msg.id,
            text: msg.text || "[No text content]",
          };
          allMessages.push(messageData);
          messageCount++;
        });

        offsetId = messages[messages.length - 1].id;

        // Calculate progress and estimated time
        const progress = ((totalMessages - offsetId) / totalMessages) * 100;
        const elapsedTime = (Date.now() - startTime) / 1000;
        const estimatedTotalTime = (elapsedTime * 100) / progress;
        const remainingTime = Math.max(0, estimatedTotalTime - elapsedTime);

        const progressBar =
          "█".repeat(Math.floor(progress / 2)) +
          "░".repeat(50 - Math.floor(progress / 2));

        // Clear previous line and update progress with time estimate
        process.stdout.write(
          `\r💫 Progress: ${progressBar} ${Math.floor(
            progress
          )}% | Found: ${messageCount} messages | ETA: ${Math.floor(
            remainingTime
          )}s`
        );

        await sleep(1000);
      } catch (batchError) {
        console.error("\n❌ Error in batch:", batchError);
        await sleep(5000);
        continue;
      }
    }

    // Add more detailed message formatting
    const fileContent = allMessages
      .map(
        (msg) =>
          `📅 Date: ${new Date(msg.date).toLocaleString()}\n` +
          `📌 Message ID: ${msg.messageId}\n` +
          `💬 Text: ${msg.text}\n` +
          `${"─".repeat(40)}\n`
      )
      .join("");

    fs.writeFileSync(outputFile, fileContent);

    console.log("\n\n✅ Operation completed successfully!");
    console.log(`📊 Statistics:`);
    console.log(
      `   • Total messages scanned: ${totalMessages.toLocaleString()}`
    );
    console.log(`   • Messages found: ${messageCount.toLocaleString()}`);
    console.log(
      `   • Success rate: ${((messageCount / totalMessages) * 100).toFixed(2)}%`
    );
    console.log(`📂 Output saved to: ${outputFile}\n`);
  } catch (error) {
    if (error.message.includes("CHANNEL_INVALID")) {
      console.error(
        "\n❌ Invalid channel/group ID. Please check the CHAT_ID and make sure:"
      );
      console.log("   1. You are a member of the channel/group");
      console.log("   2. The channel/group is accessible");
      console.log("   3. The CHAT_ID is correct");
    } else {
      console.error("\n❌ Fatal Error:", error.message);
    }
  } finally {
    await client.disconnect();
    rl.close();
    console.log("👋 Session ended. Goodbye!\n");
    process.exit(0);
  }
}

console.clear();
console.log("🤖 Telegram Message Fetcher");
console.log("⚠️  Before starting, make sure you have:");
console.log("   • Valid API_ID and API_HASH");
console.log("   • Correct TARGET_USERNAME");
console.log("   • Valid CHAT_ID\n");
getAllUserMessages();

process.on("SIGINT", async () => {
  await client.disconnect();
  rl.close();
  process.exit(0);
});
