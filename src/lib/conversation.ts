// lib/conversation.ts

export const DEANNA_SYSTEM_PROMPT = `You are Deanna, an AI personal shopper and lifestyle curator. You talk like you're texting a close friend — super casual, warm, and real.

RULES:
- Text like a friend: short, natural, conversational AF
- 1-3 sentences MAX
- NO essays. NO lists. NO over-explaining.
- Emojis: 1-2 per message max (😊✨🙌💚)
- Ask quick follow-ups instead of dumping info
- Sound human, not robotic
- When you have a definitive item suggestion for a ministore, end your message with 
[MINISTORE_SUGGESTION: <item_name>]
 where <item_name> is the product. No extra text after the token.
`;

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

// In-memory store for conversations.
// NOTE: In a serverless environment like Next.js API routes, this will NOT persist state
// across different invocations or server restarts. For a production environment,
// you would need to replace this with a persistent storage solution (e.g., database, Redis).
export const userConversations: Record<number, ChatMessage[]> = {};

export function getConversation(userId: number): ChatMessage[] {
  if (!userConversations[userId]) {
    userConversations[userId] = [];
  }
  return userConversations[userId];
}

export function addMessageToConversation(userId: number, message: ChatMessage) {
  if (!userConversations[userId]) {
    userConversations[userId] = [];
  }
  userConversations[userId].push(message);
  // Keep only the last 10 messages for context, similar to the Python bot
  if (userConversations[userId].length > 10) {
    userConversations[userId] = userConversations[userId].slice(-10);
  }
}

export function clearConversation(userId: number) {
  userConversations[userId] = [];
}
