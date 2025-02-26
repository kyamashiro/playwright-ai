/**
 * Playwright関連の処理を行うモジュール
 *
 * このファイルでは、Playwrightを使用してE2Eテストを実行する機能を提供します。
 * 生成されたテストコードをファイルに保存し、Playwrightを使用してテストを実行します。
 */

import * as fs from "fs/promises";
import * as path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { GeneratedTest, TestOptions, TestResult } from "../types/index.js";

const execPromise = promisify(exec);

// テストファイルを保存するディレクトリ
const TEST_DIR = path.join(process.cwd(), "tests");

/**
 * 生成されたテストコードをファイルに保存する
 * @param test 生成されたテスト
 * @returns 保存されたファイルのパス
 */
export async function saveTestFile(test: GeneratedTest): Promise<string> {
	try {
		// テストディレクトリが存在しない場合は作成
		await fs.mkdir(TEST_DIR, { recursive: true });

		// ファイル名が指定されていない場合はデフォルト名を使用
		const filename = test.filename || `test-${Date.now()}.spec.ts`;
		const filePath = path.join(TEST_DIR, filename);

		// テストコードをファイルに書き込む
		await fs.writeFile(filePath, test.code, "utf-8");

		console.log(`テストファイルを保存しました: ${filePath}`);
		return filePath;
	} catch (error) {
		console.error("テストファイルの保存中にエラーが発生しました:", error);
		throw new Error(
			`テストファイルの保存に失敗しました: ${(error as Error).message}`,
		);
	}
}

/**
 * Playwrightを使用してテストを実行する
 * @param testFilePath テストファイルのパス
 * @param options テストオプション
 * @returns テスト実行結果
 */
export async function runTest(
	testFilePath: string,
	options?: TestOptions,
): Promise<TestResult> {
	try {
		const startTime = Date.now();
		const logs: string[] = [];

		// テストコマンドを構築
		let command = "npx playwright test";

		// テストファイルのパスを追加
		command += ` ${testFilePath}`;

		// ブラウザオプションを追加
		if (options?.browser) {
			command += ` --project=${options.browser}`;
		}

		// ヘッドレスモードオプションを追加
		if (options?.headless === false) {
			command += " --headed";
		}

		// タイムアウトオプションを追加
		if (options?.timeout) {
			command += ` --timeout=${options.timeout}`;
		}

		logs.push(`実行コマンド: ${command}`);

		try {
			// テストを実行
			const { stdout, stderr } = await execPromise(command);
			logs.push("標準出力:");
			logs.push(stdout);

			if (stderr) {
				logs.push("標準エラー出力:");
				logs.push(stderr);
			}

			const duration = Date.now() - startTime;
			return {
				success: true,
				duration,
				logs,
			};
		} catch (error) {
			const execError = error as {
				stdout?: string;
				stderr?: string;
				message?: string;
			};

			if (execError.stdout) {
				logs.push("標準出力:");
				logs.push(execError.stdout);
			}

			if (execError.stderr) {
				logs.push("標準エラー出力:");
				logs.push(execError.stderr);
			}

			const duration = Date.now() - startTime;
			return {
				success: false,
				duration,
				error: execError.message || "テスト実行中にエラーが発生しました",
				logs,
			};
		}
	} catch (error) {
		console.error("テスト実行中にエラーが発生しました:", error);
		throw new Error(`テスト実行に失敗しました: ${(error as Error).message}`);
	}
}

/**
 * テスト結果を整形して表示する
 * @param result テスト実行結果
 * @returns 整形されたテスト結果
 */
export function formatTestResult(result: TestResult): string {
	let output = "";

	if (result.success) {
		output += "✅ テストが成功しました\n";
	} else {
		output += "❌ テストが失敗しました\n";
		if (result.error) {
			output += `エラー: ${result.error}\n`;
		}
	}

	output += `実行時間: ${result.duration}ms\n\n`;

	output += "--- ログ ---\n";
	output += result.logs.join("\n");

	return output;
}

/**
 * スクリーンショットを撮影する
 * @param testName テスト名
 * @param page Playwrightのページオブジェクト
 * @returns スクリーンショットのパス
 */
export async function takeScreenshot(
	testName: string,
	page: any,
): Promise<string> {
	try {
		// スクリーンショットディレクトリが存在しない場合は作成
		const screenshotDir = path.join(process.cwd(), "screenshots");
		await fs.mkdir(screenshotDir, { recursive: true });

		// スクリーンショットのファイル名を生成
		const filename = `${testName}-${Date.now()}.png`;
		const filePath = path.join(screenshotDir, filename);

		// スクリーンショットを撮影
		await page.screenshot({ path: filePath, fullPage: true });

		console.log(`スクリーンショットを保存しました: ${filePath}`);
		return filePath;
	} catch (error) {
		console.error("スクリーンショットの撮影中にエラーが発生しました:", error);
		throw new Error(
			`スクリーンショットの撮影に失敗しました: ${(error as Error).message}`,
		);
	}
}
