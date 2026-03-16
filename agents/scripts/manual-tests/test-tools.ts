import { ComposerAgent } from '../../src/core/composer-agent';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { consola } from 'consola';
import fs from 'fs';
import path from 'path';

async function runToolsTest() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    consola.error('GEMINI_API_KEY is not set');
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const agent = new ComposerAgent(genAI);

  const tools = [
    {
      name: 'save_json',
      description: 'Save data to a JSON file',
      parameters: {
        type: 'object',
        properties: {
          filename: { type: 'string' },
          data: { type: 'object' },
        },
        required: ['filename', 'data'],
      },
    },
  ];

  const prompt = 'モーツァルトの基本情報を JSON で `mozart.json` という名前で保存して';
  consola.info(`Testing agent with tools. Prompt: ${prompt}`);

  try {
    const response = await agent.runWithTools([{ role: 'user', content: prompt }], tools);

    consola.success('Agent Final Response:');
    consola.log('\n' + response + '\n');

    // Check if the file was "saved" (this is a mock/test, depends on tool implementation)
    const expectedFilePath = path.join(process.cwd(), 'mozart.json');
    if (fs.existsSync(expectedFilePath)) {
      consola.info('\n--- Saved JSON File Content ---');
      const savedData = fs.readFileSync(expectedFilePath, 'utf-8');
      consola.log(savedData);
    }
  } catch (error) {
    consola.error('Agent execution failed:', error);
  }
}

runToolsTest();
