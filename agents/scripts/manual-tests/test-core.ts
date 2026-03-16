import { ComposerAgent } from '../../src/core/composer-agent';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { consola } from 'consola';

async function runCoreTest() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    consola.error('GEMINI_API_KEY is not set');
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const agent = new ComposerAgent(genAI);

  const prompt = 'バッハの生涯について3行で教えて';
  consola.info(`Sending prompt: ${prompt}`);

  try {
    const response = await agent.run([{ role: 'user', content: prompt }]);
    consola.success('Agent Response:');
    consola.log('\n' + response + '\n');
  } catch (error) {
    consola.error('Error during agent execution:', error);
  }
}

runCoreTest();
