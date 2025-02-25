/**
 * AI関連の処理を行うモジュール
 *
 * このファイルでは、Anthropic APIを使用してテストコードを生成する機能を提供します。
 * テストシナリオからAIプロンプトを生成し、AIにプロンプトを送信してテストコードを取得します。
 */

import type { AIPrompt, AIResponse, TestScenario } from "../types/index.js";

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
