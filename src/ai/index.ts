/**
 * AI関連の処理を行うモジュール
 *
 * このファイルでは、Anthropic APIまたはローカルLLM（LM Studio）を使用してテストコードを生成する機能を提供します。
 * テストシナリオからAIプロンプトを生成し、AIにプロンプトを送信してテストコードを取得します。
 * 環境変数LLM=localの場合は、ローカルLLMサーバーを使用します。
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

// 環境変数からLLMの種類を取得する関数
function isLocalLLM(): boolean {
	return process.env.LLM === "local";
}

// 環境変数からローカルLLMのベースURLを取得する関数
function getLocalLLMBaseURL(): string {
	const baseURL = process.env.LLM_BASE_URL;

	if (!baseURL) {
		throw new Error(
			"LLM_BASE_URLが設定されていません。.envファイルを確認してください。",
		);
	}

	return baseURL;
}

// 環境変数からベースURLを取得する関数
function getBaseUrl(): string | undefined {
	return process.env.TEST_TARGET_BASE_URL;
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

	// テスト対象のURLを設定
	const baseUrl = getBaseUrl();
	if (scenario.url) {
		userPrompt += `テスト対象のURL: ${scenario.url}\n\n`;
	} else if (baseUrl) {
		userPrompt += `テスト対象のURL: ${baseUrl}\n\n`;
	}

	if (scenario.options) {
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

// APIレスポンスの型定義
interface LocalLLMResponse {
    choices: Array<{
        message: {
            content: string;
        };
    }>;
}

interface AnthropicResponse {
    content: Array<{
        text: string;
    }>;
}

/**
 * AIにプロンプトを送信してテストコードを生成する
 * @param prompt AIプロンプト
 * @returns 生成されたテストコード
 */
export async function generateTestCode(prompt: AIPrompt): Promise<AIResponse> {
	try {
		let response: Response;
		let content: string;

		if (isLocalLLM()) {
			// ローカルLLM（LM Studio）を使用
			const baseURL = getLocalLLMBaseURL();

			response = await fetch(`${baseURL}/v1/chat/completions`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				} as HeadersInit,
				body: JSON.stringify({
					model: "local-model", // LM Studioではモデル名は任意
					max_tokens: 4000,
					messages: [
						{
							role: "system",
							content: prompt.system,
						},
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

			const data: LocalLLMResponse = await response.json();
			content = data.choices[0].message.content;
		} else {
			// Anthropic APIを使用
			const apiKey = getApiKey();

			response = await fetch("https://api.anthropic.com/v1/messages", {
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

			const data: AnthropicResponse = await response.json();
			content = data.content[0].text;
		}

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
		let response: Response;
		let content: string;

		if (isLocalLLM()) {
			// ローカルLLM（LM Studio）を使用
			const baseURL = getLocalLLMBaseURL();

			response = await fetch(`${baseURL}/v1/chat/completions`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				} as HeadersInit,
				body: JSON.stringify({
					model: "local-model", // LM Studioではモデル名は任意
					max_tokens: 4000,
					messages: [
						{
							role: "system",
							content: prompt.system,
						},
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

			const data: LocalLLMResponse = await response.json();
			content = data.choices[0].message.content;
		} else {
			// Anthropic APIを使用
			const apiKey = getApiKey();

			response = await fetch("https://api.anthropic.com/v1/messages", {
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

			const data: AnthropicResponse = await response.json();
			content = data.content[0].text;
		}

		return content;
	} catch (error) {
		console.error("AIによるテストコード生成中にエラーが発生しました:", error);
		throw new Error(
			`AIによるテストコード生成に失敗しました: ${(error as Error).message}`,
		);
	}
}
