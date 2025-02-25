/**
 * CLIインターフェースを提供するモジュール
 * 
 * このファイルでは、コマンドラインからテストシナリオを入力し、
 * AIによるテストコード生成とPlaywrightによるテスト実行を行うインターフェースを提供します。
 */

import * as readline from 'readline';
import { TestScenario, TestOptions, GeneratedTest } from '../types/index.js';
import { createPrompt, generateTestCode } from '../ai/index.js';
import { saveTestFile, runTest, formatTestResult } from '../playwright/index.js';

// コマンドラインインターフェースの作成
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

/**
 * ユーザーからの入力を取得する
 * @param question 質問文
 * @returns ユーザーの入力
 */
function askQuestion(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

/**
 * テストシナリオの入力を受け付ける
 * @returns テストシナリオ
 */
async function getTestScenario(): Promise<TestScenario> {
  console.log('=== E2Eテスト生成ツール ===');
  console.log('テストシナリオを入力してください。AIがPlaywrightのテストコードを生成します。');
  
  const description = await askQuestion('\nテストシナリオの説明（自然言語）: ');
  if (!description) {
    throw new Error('テストシナリオの説明は必須です。');
  }

  const url = await askQuestion('テスト対象のURL（省略可能）: ');
  
  const options: TestOptions = {};
  
  const browserInput = await askQuestion('ブラウザ（chromium/firefox/webkit、デフォルト: chromium）: ');
  if (browserInput && ['chromium', 'firefox', 'webkit'].includes(browserInput)) {
    options.browser = browserInput as 'chromium' | 'firefox' | 'webkit';
  }
  
  const headlessInput = await askQuestion('ヘッドレスモード（y/n、デフォルト: y）: ');
  if (headlessInput) {
    options.headless = headlessInput.toLowerCase() !== 'n';
  }
  
  const screenshotInput = await askQuestion('スクリーンショットを撮影（y/n、デフォルト: n）: ');
  if (screenshotInput) {
    options.screenshot = screenshotInput.toLowerCase() === 'y';
  }
  
  const timeoutInput = await askQuestion('タイムアウト（ミリ秒、デフォルト: 30000）: ');
  if (timeoutInput && !isNaN(Number(timeoutInput))) {
    options.timeout = Number(timeoutInput);
  }

  return {
    description,
    url: url || undefined,
    options: Object.keys(options).length > 0 ? options : undefined,
  };
}

/**
 * テストシナリオからテストコードを生成する
 * @param scenario テストシナリオ
 * @returns 生成されたテスト
 */
async function generateTest(scenario: TestScenario): Promise<GeneratedTest> {
  console.log('\nAIによるテストコード生成中...');
  
  // AIプロンプトを作成
  const prompt = createPrompt(scenario);
  
  // AIによるテストコード生成
  const aiResponse = await generateTestCode(prompt);
  
  // テストファイル名を生成
  const filename = `test-${Date.now()}.spec.ts`;
  
  return {
    code: aiResponse.testCode,
    filename,
    explanation: aiResponse.explanation,
  };
}

/**
 * テストを実行する
 * @param test 生成されたテスト
 * @param scenario テストシナリオ
 */
async function executeTest(test: GeneratedTest, scenario: TestScenario): Promise<void> {
  // テストコードと説明を表示
  console.log('\n=== 生成されたテストコード ===');
  console.log(test.code);
  
  console.log('\n=== AIによる説明 ===');
  console.log(test.explanation);
  
  // テストを実行するかどうか確認
  const runTestInput = await askQuestion('\nテストを実行しますか？（y/n）: ');
  if (runTestInput.toLowerCase() !== 'y') {
    console.log('テストの実行をスキップします。');
    return;
  }
  
  // テストファイルを保存
  console.log('\nテストファイルを保存中...');
  const testFilePath = await saveTestFile(test);
  
  // テストを実行
  console.log('\nテストを実行中...');
  const result = await runTest(testFilePath, scenario.options);
  
  // テスト結果を表示
  console.log('\n=== テスト実行結果 ===');
  console.log(formatTestResult(result));
}

/**
 * CLIを実行する
 */
export async function runCLI(): Promise<void> {
  try {
    // テストシナリオの入力を受け付ける
    const scenario = await getTestScenario();
    
    // テストコードを生成
    const test = await generateTest(scenario);
    
    // テストを実行
    await executeTest(test, scenario);
    
  } catch (error) {
    console.error('\nエラーが発生しました:', (error as Error).message);
  } finally {
    // readline インターフェースを閉じる
    rl.close();
  }
}

/**
 * ヘルプメッセージを表示する
 */
export function showHelp(): void {
  console.log(`
E2Eテスト生成ツール

使用方法:
  npx scenario-test [オプション]

オプション:
  --help, -h     ヘルプを表示
  --version, -v  バージョンを表示

説明:
  このツールは、自然言語でテストシナリオを入力すると、AIがPlaywrightのE2Eテストコードを
  自動生成し、実行するものです。テストシナリオの入力から、テストコードの生成、テストの
  実行までをインタラクティブに行うことができます。
  `);
}

/**
 * バージョン情報を表示する
 */
export function showVersion(): void {
  console.log('E2Eテスト生成ツール v0.1.0');
}
