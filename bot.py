#!/usr/bin/env python3
"""
Deanna Telegram Bot - AI Personal Shopper
"""
import os
import logging
import random
from deanna_utils import create_new_book
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, filters, ContextTypes
import openai
from dotenv import load_dotenv

load_dotenv('.env')

logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

openai.api_key = os.getenv('OPENAI_API_KEY')

user_conversations = {}

DEANNA_SYSTEM_PROMPT = """You are Deanna, an AI personal shopper and lifestyle curator. You talk like you're texting a close friend — super casual, warm, and real.

RULES:
- Text like a friend: short, natural, conversational AF
- 1-3 sentences MAX
- NO essays. NO lists. NO over-explaining.
- Emojis: 1-2 per message max (😊✨🙌💚)
- Ask quick follow-ups instead of dumping info
- Sound human, not robotic
- When you have a definitive item suggestion for a ministore, end your message with `[MINISTORE_SUGGESTION: <item_name>]` where `<item_name>` is the product. No extra text after the token.
"""

async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user_id = update.effective_user.id
    user_conversations[user_id] = []
    await update.message.reply_text(
        "Hi! I'm Deanna — your AI personal shopper and lifestyle buddy. What's up? 💚 What can I help you find today?"
    )

async def clear(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user_id = update.effective_user.id
    user_conversations[user_id] = []
    await update.message.reply_text("✨ Memory cleared! Let's start fresh. What can I help you with?")

async def handle_message(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    user_id = update.effective_user.id
    user_message = update.message.text
    
    if user_id not in user_conversations:
        user_conversations[user_id] = []
    
    user_conversations[user_id].append({"role": "user", "content": user_message})
    
    if len(user_conversations[user_id]) > 10:
        user_conversations[user_id] = user_conversations[user_id][-10:]
    
    try:
        response = openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": DEANNA_SYSTEM_PROMPT},
                *user_conversations[user_id]
            ],
            max_tokens=50,
            temperature=0.9
        )
        
        deanna_response = response.choices[0].message.content
        logger.info(f"Deanna's raw response: '{deanna_response}'")
        
        # Check for ministore suggestion token
        store_suggestion_prefix = "[MINISTORE_SUGGESTION: "
        
        # Find the start of the suggestion token
        start_index = deanna_response.find(store_suggestion_prefix)

        if start_index != -1: # If the prefix is found
            # The remaining part of the string from where the token starts
            substring_from_token = deanna_response[start_index:]
            
            if substring_from_token.endswith("]"):
                # The actual token string should be extracted from the beginning of the `substring_from_token`
                # up to the closing bracket. We need to be careful if there's other text after the bracket,
                # but the prompt specifically says "No extra text after the token."
                # We'll extract the part of the message that *might* contain the token and then parse it.
                
                # Find the closing bracket in the substring_from_token
                end_index_in_substring = substring_from_token.rfind("]")
                
                if end_index_in_substring != -1:
                    full_token_string = substring_from_token[:end_index_in_substring + 1] # Include the ']'
                    
                    # Extract the item name from within the token
                    item_name_start_index = len(store_suggestion_prefix)
                    item_name = full_token_string[item_name_start_index:-1].strip()
                    
                    # The response to be displayed to the user should exclude the token
                    display_response_to_user = deanna_response[:start_index].strip()
                    
                    if not display_response_to_user:
                        # If there's no text before the token, use a default message
                        display_response_to_user = f"Got it! I'm creating a special ministore for '{item_name}' just for you! ✨"
                    else:
                        display_response_to_user += f"\n\nI'm creating a special ministore for '{item_name}' just for you! ✨"
                    
                    # Call the API
                    logger.info(f"Attempting to create ministore for: {item_name} (User ID: 221)")
                    try:
                        api_response = create_new_book(term=item_name, user_id=221)
                        if api_response and api_response.get("success") is True: # Corrected check
                            store_url = api_response.get("book_url", "No URL provided") # Corrected key
                            display_response_to_user += f"\n\n{store_url}"
                        else:
                            display_response_to_user += "\nOops! Couldn't create the ministore right now. Please try again later. 💔"
                            logger.error(f"Failed to create ministore: {api_response.get('message', 'Unknown error') if api_response else 'No API response'}") # Improved error logging
                    except Exception as api_e:
                        display_response_to_user += "\nSomething went wrong while trying to set up your ministore. 😢"
                        logger.error(f"Error calling create_new_book: {api_e}")

                    user_conversations[user_id].append({"role": "assistant", "content": display_response_to_user})
                    await update.message.reply_text(display_response_to_user)
                else:
                    logger.warning(f"Ministore suggestion token started but ']' not found after prefix: '{deanna_response}'")
                    # Fallback to normal message if token not properly formed
                    user_conversations[user_id].append({"role": "assistant", "content": deanna_response})
                    await update.message.reply_text(deanna_response)
            else: # Token prefix found, but not properly closed with ']'
                logger.warning(f"Ministore suggestion token prefix found, but message does not end with ']': '{deanna_response}'")
                # Fallback to normal message if token not properly formed
                user_conversations[user_id].append({"role": "assistant", "content": deanna_response})
                await update.message.reply_text(deanna_response)
        
        else:
            # Normal response if no ministore suggestion token prefix is found
            user_conversations[user_id].append({"role": "assistant", "content": deanna_response})
            await update.message.reply_text(deanna_response)
        
    except Exception as e:
        logger.error(f"OpenAI Error: {e}")
        reply = random.choice(["Tell me more? 💚", "Interesting! Go on? ✨", "Love it! What else? 🙌"])
        user_conversations[user_id].append({"role": "assistant", "content": reply})
        await update.message.reply_text(reply)

def main() -> None:
    application = Application.builder().token(os.getenv('TELEGRAM_BOT_TOKEN')).build()
    application.add_handler(CommandHandler("start", start))
    application.add_handler(CommandHandler("clear", clear))
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_message))
    
    logger.info("🚀 Deanna bot is starting...")
    application.run_polling(allowed_updates=Update.ALL_TYPES)

if __name__ == '__main__':
    main()
