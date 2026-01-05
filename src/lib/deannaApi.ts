// lib/deannaApi.ts
import axios from 'axios';

const DEANNA_API_URL = process.env.DEANNA_API_URL;
const DEANNA_API_KEY = process.env.DEANNA_API_KEY;

export async function createMinistore(term: string, userId: number = 221): Promise<{ success: boolean; book_url?: string; message?: string }> {
  if (!DEANNA_API_URL || !DEANNA_API_KEY) {
    console.error('DEANNA_API_URL or DEANNA_API_KEY is not set in environment variables.');
    return { success: false, message: 'API configuration missing.' };
  }

  const headers = {
    "Content-Type": "application/json",
    "X-API-KEY": DEANNA_API_KEY,
  };

  const payload = {
    term: term,
    user_id: userId,
  };

  try {
    const response = await axios.post(DEANNA_API_URL, payload, { headers });
    const jsonResponse = response.data;
    console.log(`Store API raw JSON response:`, jsonResponse);

    if (jsonResponse && jsonResponse.success === true) {
      return { success: true, book_url: jsonResponse.book_url };
    } else {
      return { success: false, message: jsonResponse.message || 'Unknown error from Deanna API.' };
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(`Error calling Deanna API: ${error.message}`);
      console.error(`Response data: ${error.response?.data}`);
      return { success: false, message: `Failed to create ministore: ${error.response?.data?.message || error.message}` };
    } else {
      console.error(`Unexpected error: ${error}`);
      return { success: false, message: 'An unexpected error occurred.' };
    }
  }
}
