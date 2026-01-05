import { Telegraf } from 'telegraf';
import { NextRequest, NextResponse } from 'next/server';
import { DEANNA_SYSTEM_PROMPT, getConversation, addMessageToConversation, clearConversation, ChatMessage } from '@/lib/conversation';
import { createMinistore } from '@/lib/deannaApi';
import OpenAI from 'openai';
import { randomBytes } from 'crypto'; // For random response on error

// Initialize Telegraf bot with the bot token from environment variables
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN as string);

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Command handlers
bot.start(async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId) return;
  clearConversation(userId); // Clear existing conversation for the user
  await ctx.reply(
    "Hi! I'm Deanna — your AI personal shopper and lifestyle buddy. What's up? 💚 What can I help you find today?"
  );
});

bot.command('clear', async (ctx) => {
  const userId = ctx.from?.id;
  if (!userId) return;
  clearConversation(userId); // Clear existing conversation for the user
  await ctx.reply("✨ Memory cleared! Let's start fresh. What can I help you with?");
});

// Message handler for text messages
bot.on('text', async (ctx) => {
  const userId = ctx.from?.id;
  const userMessage = ctx.message?.text;

  if (!userId || !userMessage) {
    console.error('Missing user ID or message text.');
    return;
  }

  addMessageToConversation(userId, { role: "user", content: userMessage });

  const conversation = getConversation(userId);
  const messagesForOpenAI = [
    { role: "system", content: DEANNA_SYSTEM_PROMPT },
    ...conversation
  ] as OpenAI.Chat.Completions.ChatCompletionMessageParam[];

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messagesForOpenAI,
      max_tokens: 150, // Increased max_tokens slightly for better responses, was 50 in Python
      temperature: 0.9,
    });

    let deannaResponse = response.choices[0].message.content || "";
    console.log(`Deanna's raw response: '${deannaResponse}'`);

    const storeSuggestionPrefix = "[MINISTORE_SUGGESTION:";
    const startIndex = deannaResponse.indexOf(storeSuggestionPrefix);

    if (startIndex !== -1 && deannaResponse.endsWith("]")) {
      const fullTokenString = deannaResponse.substring(startIndex);
      const item_name_start_index = storeSuggestionPrefix.length;
      const itemName = fullTokenString.substring(item_name_start_index, fullTokenString.length - 1).trim();

      let displayResponseToUser = deannaResponse.substring(0, startIndex).trim();

      if (!displayResponseToUser) {
        displayResponseToUser = `Got it! I'm creating a special ministore for '${itemName}' just for you! ✨`;
      } else {
        displayResponseToUser += `\n\nI'm creating a special ministore for '${itemName}' just for you! ✨`;
      }

      console.log(`Attempting to create ministore for: ${itemName} (User ID: ${userId})`);
      try {
        const apiResponse = await createMinistore(itemName, userId);
        if (apiResponse.success && apiResponse.book_url) {
          displayResponseToUser += `\n\n${apiResponse.book_url}`;
        } else {
          displayResponseToUser += "\nOops! Couldn't create the ministore right now. Please try again later. 💔";
          console.error(`Failed to create ministore: ${apiResponse.message}`);
        }
      } catch (api_e) {
        displayResponseToUser += "\nSomething went wrong while trying to set up your ministore. 😢";
        console.error(`Error calling createMinistore: ${api_e}`);
      }
      addMessageToConversation(userId, { role: "assistant", content: displayResponseToUser });
      await ctx.reply(displayResponseToUser);

    } else {
      // Normal response if no ministore suggestion token is found or if malformed
      addMessageToConversation(userId, { role: "assistant", content: deannaResponse });
      await ctx.reply(deannaResponse);
    }

  } catch (error) {
    console.error('OpenAI Error:', error);
    const replies = ["Tell me more? 💚", "Interesting! Go on? ✨", "Love it! What else? 🙌"];
    const reply = replies[Math.floor(Math.random() * replies.length)]; // Random choice
    addMessageToConversation(userId, { role: "assistant", content: reply });
    await ctx.reply(reply);
  }
});


// This function handles POST requests to the API route
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    await bot.handleUpdate(body); // Let Telegraf handle the update

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error handling Telegram webhook:', error);
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

// Optionally, handle GET requests for basic health check or setup instructions
export async function GET() {
  return NextResponse.json({ status: 'Telegram Webhook API is running' });
}

