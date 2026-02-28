import { BaseAgent } from '../../src/core/agent.js';
import { AgentDataWriterTool } from '../../src/tools/agent-data-writer.tool.js';
import { ComposerMasterSchema } from '@/application/composer/master/composer-master.schema';
import { GeminiModels } from '../../src/core/models.js';
import { consola } from 'consola';
import fs from 'fs';

async function runMozartTest() {
  consola.info('--- AI Agent AgentDataWriterTool Demo ---');

  if (!process.env.GEMINI_API_KEY) {
    consola.error('GEMINI_API_KEY is not set. Please set it to run the demo.');
    process.exit(1);
  }

  // 1. ツールの準備
  // 作曲家等のデータを保存するためのWriterToolを初期化します。
  // スキーマはアプリ本体で定義されている ComposerMasterSchema を利用します。
  const composerWriterTool = new AgentDataWriterTool(
    'saveComposerData', // AIに認識させる関数名
    'Save structured composer master data into the local file system as a JSON file. Use this when you have collected accurate information about a composer.', // AI向けの関数の説明
    // _schemaVersion や _generatorMeta は内部で自動付与・管理されるため、
    // AI には純粋な入力データ（CreateComposerCommandSchema相当）だけを要求するように Omit します。
    ComposerMasterSchema.omit({ _schemaVersion: true, _generatorMeta: true }),
    './data/composers', // 保存先ディレクトリ
    'slug', // ファイル名に使うフィールド
  );

  // 2. BaseAgentの準備
  const agent = new BaseAgent({
    modelName: GeminiModels.FLASH,
    systemInstruction:
      'You are a classical music data specialist. ' +
      'Your job is to provide highly accurate master data for classical composers. ' +
      'When asked about a composer, always use the `saveComposerData` tool to save the information to the system. ' +
      '\n\n' +
      '### Data Structure Rules:\n' +
      '- Multilingual Fields: Fields like `fullName`, `displayName`, `shortName`, and `biography` MUST be objects with language codes as keys (e.g., `{ "en": "...", "ja": "..." }`). Always provide at least "en" and "ja" if possible.\n' +
      '- Dates: Use ISO8601 format (YYYY-MM-DD).\n' +
      '- Ensure all required fields are provided correctly according to the tool schema.',
    enableGrounding: false, // 現行モデルでは Function Calling との併用が制限されているため false
  });

  // 3. エージェントへの指示（プロンプト）
  const prompt =
    'モーツァルト（Wolfgang Amadeus Mozart）のマスタデータを生成して、ツールを使って保存してください。slugは "mozart-wa" としてください。';
  consola.box(`User Prompt:\n${prompt}`);

  try {
    // 4. ツールの実行を伴うエージェントの推論ループを開始
    const resultText = await agent.runWithTools(
      [{ role: 'user', content: prompt }],
      [composerWriterTool], // ツール群をAgentに渡す
      {
        onToolCall: (event, name) => {
          if (event === 'start') {
            consola.info(`🤖 Agent decided to use tool: ${name}...`);
          } else {
            consola.success(`✅ Tool ${name} finished execution.`);
          }
        },
      },
    );

    consola.info('\n--- Agent Final Answer ---');
    consola.log(resultText);

    // 5. 保存されたファイルの内容を確認
    const expectedFilePath = './data/composers/mozart-wa.json';
    if (fs.existsSync(expectedFilePath)) {
      consola.info('\n--- Saved JSON File Content ---');
      const savedData = fs.readFileSync(expectedFilePath, 'utf-8');
      console.log(savedData);
    }
  } catch (error) {
    consola.error('Agent execution failed:', error);
  }
}

runMozartTest();
