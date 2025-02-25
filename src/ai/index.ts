/**
 * AI関連の処理を行うモジュール
 *
 * このファイルでは、Anthropic APIを使用してテストコードを生成する機能を提供します。
 * テストシナリオからAIプロンプトを生成し、AIにプロンプトを送信してテストコードを取得します。
 */

import type { AIPrompt, AIResponse, TestScenario } from "../types/index.js";
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// 環境変数からAPIキーを取得する関数
function getApiKey(): string {
	const apiKey = process.env.API_KEY;

	if (!apiKey) {
		throw new Error(
			"API_KEYが設定されていません。.envファイルを確認してください。",
		);
	}

	return apiKey;
}

/**
 * システムプロンプト
 * AIにPlaywrightのテストコードを生成させるための指示
 */
const SYSTEM_PROMPT = `あなたはPlaywrightを使用したE2Eテストの専門家です。
ユーザーから提供されるテストシナリオに基づいて、Playwrightのテストコードを生成してください。

以下のガイドラインに従ってください：

1. テストコードはTypeScriptで記述し、Playwrightの最新のベストプラクティスに従ってください。
2. テストコードは実行可能で、エラーがないようにしてください。
3. テストコードには適切なアサーションを含めてください。
4. コードには詳細なコメントを含め、各ステップの目的を説明してください。
5. テストコードは以下の形式で返してください：

\`\`\`typescript
// ここにテストコードを記述
\`\`\`

6. テストコードの後に、コードの説明を日本語で提供してください。

注意：
- URLが指定されていない場合は、テストコードの中でURLを設定する部分をコメントアウトしてください。
- ブラウザの種類、ヘッドレスモード、スクリーンショットの設定などのオプションが指定されている場合は、それに従ってください。
- 指定がない場合は、デフォルト値（chromium、ヘッドレスモード有効、スクリーンショット無効）を使用してください。
`;

/**
 * テストシナリオからAIプロンプトを生成する
 * @param scenario テストシナリオ
 * @returns AIプロンプト
 */
export function createPrompt(scenario: TestScenario): AIPrompt {
	let userPrompt = `以下のテストシナリオに基づいて、Playwrightのテストコードを生成してください：\n\n${scenario.description}\n\n`;

	if (scenario.url) {
		userPrompt += `テスト対象のURL: ${scenario.url}\n\n`;
	}

	if (scenario.options) {
		userPrompt += "テストオプション:\n";
		if (scenario.options.browser) {
			userPrompt += `- ブラウザ: ${scenario.options.browser}\n`;
		}
		if (scenario.options.headless !== undefined) {
			userPrompt += `- ヘッドレスモード: ${scenario.options.headless ? "有効" : "無効"}\n`;
		}
		if (scenario.options.screenshot !== undefined) {
			userPrompt += `- スクリーンショット: ${scenario.options.screenshot ? "有効" : "無効"}\n`;
		}
		if (scenario.options.timeout) {
			userPrompt += `- タイムアウト: ${scenario.options.timeout}ms\n`;
		}
	}

	return {
		system: SYSTEM_PROMPT,
		user: userPrompt,
	};
}

/**
 * AIにプロンプトを送信してテストコードを生成する
 * @param prompt AIプロンプト
 * @returns 生成されたテストコード
 */
export async function generateTestCode(prompt: AIPrompt): Promise<AIResponse> {
	try {
		// APIキーを取得
		const apiKey = getApiKey();

		const response = await fetch("https://api.anthropic.com/v1/messages", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"x-api-key": apiKey,
				"anthropic-version": "2023-06-01",
			} as HeadersInit,
			body: JSON.stringify({
				model: "claude-3-opus-20240229",
				max_tokens: 4000,
				system: prompt.system,
				messages: [
					{
						role: "user",
						content: prompt.user,
					},
				],
			}),
		});

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(
				`API error: ${errorData.error?.message || response.statusText}`,
			);
		}

		const data = await response.json();
		const content = data.content[0].text;

		// テストコードと説明を抽出
		const codeMatch = content.match(/```typescript\n([\s\S]*?)```/);
		const testCode = codeMatch ? codeMatch[1] : "";

		// 説明部分を抽出（コードブロックの後の部分）
		const explanation = content
			.replace(/```typescript\n[\s\S]*?```/, "")
			.trim();

		return {
			testCode,
			explanation,
		};
	} catch (error) {
		console.error("AIによるテストコード生成中にエラーが発生しました:", error);
		throw new Error(
			`AIによるテストコード生成に失敗しました: ${(error as Error).message}`,
		);
	}
}

/**
 * AIにプロンプトを送信してストリーミングレスポンスを取得する
 * @param prompt AIプロンプト
 * @returns ストリーミングレスポンス
 */
export async function generateTestCodeStream(
	prompt: AIPrompt,
): Promise<string> {
	try {
		// ストリーミングではなく通常のレスポンスを使用
		// APIキーを取得
		const apiKey = getApiKey();

		const response = await fetch("https://api.anthropic.com/v1/messages", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"x-api-key": apiKey,
				"anthropic-version": "2023-06-01",
			} as HeadersInit,
			body: JSON.stringify({
				model: "claude-3-opus-20240229",
				max_tokens: 4000,
				system: prompt.system,
				messages: [
					{
						role: "user",
						content: prompt.user,
					},
				],
			}),
		});

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(
				`API error: ${errorData.error?.message || response.statusText}`,
			);
		}

		const data = await response.json();
		const content = data.content[0].text;
		return content;
	} catch (error) {
		console.error("AIによるテストコード生成中にエラーが発生しました:", error);
		throw new Error(
			`AIによるテストコード生成に失敗しました: ${(error as Error).message}`,
		);
	}
}

// ===== テストコード =====

describe('createPrompt', () => {
  it('基本的なテストシナリオからプロンプトを生成できること', () => {
    // テスト用のシナリオを作成
    const scenario: TestScenario = {
      description: 'ログインページのテスト'
    };

    // 関数を実行
    const prompt = createPrompt(scenario);

    // 結果を検証
    expect(prompt).toHaveProperty('system');
    expect(prompt).toHaveProperty('user');
    expect(prompt.system).toBe(SYSTEM_PROMPT);
    expect(prompt.user).toContain('ログインページのテスト');
  });

  it('URLを含むテストシナリオからプロンプトを生成できること', () => {
    // テスト用のシナリオを作成
    const scenario: TestScenario = {
      description: 'ログインページのテスト',
      url: 'https://example.com/login'
    };

    // 関数を実行
    const prompt = createPrompt(scenario);

    // 結果を検証
    expect(prompt.user).toContain('ログインページのテスト');
    expect(prompt.user).toContain('テスト対象のURL: https://example.com/login');
  });

  it('オプションを含むテストシナリオからプロンプトを生成できること', () => {
    // テスト用のシナリオを作成
    const scenario: TestScenario = {
      description: 'ログインページのテスト',
      options: {
        browser: 'firefox',
        headless: false,
        screenshot: true,
        timeout: 60000
      }
    };

    // 関数を実行
    const prompt = createPrompt(scenario);

    // 結果を検証
    expect(prompt.user).toContain('ログインページのテスト');
    expect(prompt.user).toContain('ブラウザ: firefox');
    expect(prompt.user).toContain('ヘッドレスモード: 無効');
    expect(prompt.user).toContain('スクリーンショット: 有効');
    expect(prompt.user).toContain('タイムアウト: 60000ms');
  });
});

describe('generateTestCode', () => {
  // モックの設定
  beforeEach(() => {
    // 環境変数のモック
    vi.stubEnv('API_KEY', 'test-api-key');
    
    // fetchのモック
    global.fetch = vi.fn();
  });

  // モックのリセット
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetAllMocks();
  });

  it('AIからテストコードを生成できること', async () => {
    // fetchのモックレスポンスを設定
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({
        content: [
          {
            text: '```typescript\nconst test = "example";\n```\n\nこれはテストコードの説明です。'
          }
        ]
      })
    };
    (global.fetch as any).mockResolvedValue(mockResponse);

    // テスト用のプロンプトを作成
    const prompt: AIPrompt = {
      system: 'システムプロンプト',
      user: 'ユーザープロンプト'
    };

    // 関数を実行
    const result = await generateTestCode(prompt);

    // 結果を検証
    expect(result).toHaveProperty('testCode');
    expect(result).toHaveProperty('explanation');
    expect(result.testCode).toBe('const test = "example";\n');
    expect(result.explanation).toBe('これはテストコードの説明です。');

    // fetchが正しく呼び出されたことを検証
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.anthropic.com/v1/messages',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'x-api-key': 'test-api-key'
        }),
        body: expect.any(String)
      })
    );
  });

  it('APIキーが設定されていない場合にエラーをスローすること', async () => {
    // 環境変数のモックをリセット
    vi.unstubAllEnvs();

    // テスト用のプロンプトを作成
    const prompt: AIPrompt = {
      system: 'システムプロンプト',
      user: 'ユーザープロンプト'
    };

    // 関数の実行とエラーの検証
    await expect(generateTestCode(prompt)).rejects.toThrow('API_KEYが設定されていません');
  });

  it('APIレスポンスがエラーの場合にエラーをスローすること', async () => {
    // fetchのモックレスポンスを設定（エラー）
    const mockResponse = {
      ok: false,
      statusText: 'Bad Request',
      json: vi.fn().mockResolvedValue({
        error: { message: 'Invalid request' }
      })
    };
    (global.fetch as any).mockResolvedValue(mockResponse);

    // テスト用のプロンプトを作成
    const prompt: AIPrompt = {
      system: 'システムプロンプト',
      user: 'ユーザープロンプト'
    };

    // 関数の実行とエラーの検証
    await expect(generateTestCode(prompt)).rejects.toThrow('API error: Invalid request');
  });
});

describe('generateTestCodeStream', () => {
  // モックの設定
  beforeEach(() => {
    // 環境変数のモック
    vi.stubEnv('API_KEY', 'test-api-key');
    
    // fetchのモック
    global.fetch = vi.fn();
  });

  // モックのリセット
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetAllMocks();
  });

  it('AIからストリーミングレスポンスを取得できること', async () => {
    // fetchのモックレスポンスを設定
    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue({
        content: [
          {
            text: 'ストリーミングレスポンスの内容'
          }
        ]
      })
    };
    (global.fetch as any).mockResolvedValue(mockResponse);

    // テスト用のプロンプトを作成
    const prompt: AIPrompt = {
      system: 'システムプロンプト',
      user: 'ユーザープロンプト'
    };

    // 関数を実行
    const result = await generateTestCodeStream(prompt);

    // 結果を検証
    expect(result).toBe('ストリーミングレスポンスの内容');

    // fetchが正しく呼び出されたことを検証
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.anthropic.com/v1/messages',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'x-api-key': 'test-api-key'
        }),
        body: expect.any(String)
      })
    );
  });
});
