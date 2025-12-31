import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../../.env.local' });

console.log('Preludio Lab AI Agent Environment Initialized.');

if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
  console.warn('WARNING: GOOGLE_GENERATIVE_AI_API_KEY is not set in .env.local');
} else {
  console.log('Gemini API Key detected.');
}
