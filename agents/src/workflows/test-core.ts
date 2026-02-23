import { consola } from 'consola';
import { z } from 'zod';
import { BaseAgent, AgentConfig } from '../core/agent.js';
import { AgentTool } from '../core/tool.js';
import { ResilientFetcher } from '../core/fetcher.js';
import { GeminiModels } from '../core/models.js';
import { env } from '../core/env.js';

// === 1. ResilientFetcher のテスト用ツール ===
const GithubUserSchema = z.object({
  username: z.string().describe('検索するGitHubユーザー名'),
});

class GitHubUserTool implements AgentTool<z.infer<typeof GithubUserSchema>, unknown> {
  name = 'githubUserFetcher';
  description = 'GitHub APIを使用して指定されたユーザーの情報を取得します。';
  inputSchema = GithubUserSchema;

  // スロットリング（秒間1リクエスト）を設定したFetcher
  private fetcher = new ResilientFetcher({
    baseURL: 'https://api.github.com',
    requestsPerSecond: 1,
  });

  async execute(input: z.infer<typeof GithubUserSchema>): Promise<unknown> {
    const client = this.fetcher.getClient();
    const response = await client.get(`/users/${input.username}`);
    return {
      name: response.data.name,
      company: response.data.company,
      followers: response.data.followers,
    };
  }
}

// === 2. 実行スクリプト ===
async function main() {
  consola.box('AI Agent Core: 動作確認テスト');

  // 環境変数チェック (env.ts のインポート時に検証済みですが、明示的に)
  if (!env.GEMINI_API_KEY) {
    consola.error('HINT: .env.local に GEMINI_API_KEY を設定してください。');
    return;
  }

  const config: AgentConfig = {
    modelName: GeminiModels.FLASH,
    systemInstruction:
      'あなたは優秀なアシスタントです。必要に応じてツールを利用して、ユーザーの質問に日本語で簡潔に答えてください。',
  };

  try {
    const agent = new BaseAgent(config);
    const tools = [new GitHubUserTool()];

    const prompt =
      "GitHubで 'torvalds' (Linus Torvalds) と 'gaearon' (Dan Abramov) のフォロワー数を調べて、どちらが多いか教えてください。";

    consola.info('プロンプト送信中:', prompt);
    const response = await agent.runWithTools(prompt, tools);

    consola.success('エージェントの最終回答:');
    console.log('\n' + response + '\n');
  } catch (error) {
    consola.error('エラーが発生しました:', error);
  }
}

main();
