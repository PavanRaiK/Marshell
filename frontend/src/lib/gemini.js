import { GoogleGenerativeAI } from '@google/generative-ai';

const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY || 'missing-key';

// Initialize the Gemini client
export const genAI = new GoogleGenerativeAI(geminiApiKey);
