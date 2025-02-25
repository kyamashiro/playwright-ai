/**
 * E2Eテスト生成ツールの型定義
 * 
 * このファイルでは、AIを活用したE2Eテスト生成ツールで使用する型を定義します。
 * テストシナリオ、AIレスポンス、Playwrightテストコードなどの型を含みます。
 */

import { describe, it, expect } from 'vitest';

/**
 * ユーザーから入力されるテストシナリオの型
 */
export interface TestScenario {
  /** テストシナリオの説明（自然言語） */
  description: string;
  /** テスト対象のURL（オプション） */
  url?: string;
  /** テストの追加オプション */
  options?: TestOptions;
}

/**
 * テストの追加オプション
 */
export interface TestOptions {
  /** ブラウザタイプ（デフォルトはchromium） */
  browser?: 'chromium' | 'firefox' | 'webkit';
  /** ヘッドレスモードで実行するかどうか（デフォルトはtrue） */
  headless?: boolean;
  /** スクリーンショットを撮るかどうか（デフォルトはfalse） */
  screenshot?: boolean;
  /** テストのタイムアウト（ミリ秒）（デフォルトは30000） */
  timeout?: number;
}

/**
 * AIから生成されるテストコードの型
 */
export interface GeneratedTest {
  /** 生成されたPlaywrightのテストコード */
  code: string;
  /** テストファイルの名前 */
  filename: string;
  /** AIによる説明（オプション） */
  explanation?: string;
}

/**
 * テスト実行結果の型
 */
export interface TestResult {
  /** テスト成功したかどうか */
  success: boolean;
  /** テスト実行時間（ミリ秒） */
  duration: number;
  /** エラーメッセージ（失敗時） */
  error?: string;
  /** スクリーンショットのパス（オプション） */
  screenshotPath?: string;
  /** テストのログ */
  logs: string[];
}

/**
 * AIプロンプトの型
 */
export interface AIPrompt {
  /** システムプロンプト */
  system: string;
  /** ユーザープロンプト */
  user: string;
}

/**
 * AIレスポンスの型
 */
export interface AIResponse {
  /** 生成されたテストコード */
  testCode: string;
  /** AIによる説明 */
  explanation: string;
}

// ===== テストコード =====

describe('型定義', () => {
  it('TestScenarioの型が正しく定義されていること', () => {
    // TestScenarioの型を持つオブジェクトを作成
    const scenario: TestScenario = {
      description: 'ログインページのテスト',
      url: 'https://example.com/login',
      options: {
        browser: 'chromium',
        headless: true,
        screenshot: false,
        timeout: 30000
      }
    };

    // 型が正しく定義されていることを検証
    expect(scenario).toHaveProperty('description');
    expect(scenario).toHaveProperty('url');
    expect(scenario).toHaveProperty('options');
    expect(scenario.options).toHaveProperty('browser');
    expect(scenario.options).toHaveProperty('headless');
    expect(scenario.options).toHaveProperty('screenshot');
    expect(scenario.options).toHaveProperty('timeout');
  });

  it('TestOptionsの型が正しく定義されていること', () => {
    // TestOptionsの型を持つオブジェクトを作成
    const options: TestOptions = {
      browser: 'firefox',
      headless: false,
      screenshot: true,
      timeout: 60000
    };

    // 型が正しく定義されていることを検証
    expect(options).toHaveProperty('browser');
    expect(options).toHaveProperty('headless');
    expect(options).toHaveProperty('screenshot');
    expect(options).toHaveProperty('timeout');
  });

  it('GeneratedTestの型が正しく定義されていること', () => {
    // GeneratedTestの型を持つオブジェクトを作成
    const test: GeneratedTest = {
      code: 'const test = "example";',
      filename: 'test-example.spec.ts',
      explanation: 'テストコードの説明'
    };

    // 型が正しく定義されていることを検証
    expect(test).toHaveProperty('code');
    expect(test).toHaveProperty('filename');
    expect(test).toHaveProperty('explanation');
  });

  it('TestResultの型が正しく定義されていること', () => {
    // TestResultの型を持つオブジェクトを作成（成功）
    const successResult: TestResult = {
      success: true,
      duration: 1234,
      logs: ['テスト実行結果']
    };

    // 型が正しく定義されていることを検証
    expect(successResult).toHaveProperty('success');
    expect(successResult).toHaveProperty('duration');
    expect(successResult).toHaveProperty('logs');

    // TestResultの型を持つオブジェクトを作成（失敗）
    const failureResult: TestResult = {
      success: false,
      duration: 1234,
      error: 'テストが失敗しました',
      screenshotPath: '/path/to/screenshot.png',
      logs: ['テスト実行結果']
    };

    // 型が正しく定義されていることを検証
    expect(failureResult).toHaveProperty('success');
    expect(failureResult).toHaveProperty('duration');
    expect(failureResult).toHaveProperty('error');
    expect(failureResult).toHaveProperty('screenshotPath');
    expect(failureResult).toHaveProperty('logs');
  });

  it('AIPromptの型が正しく定義されていること', () => {
    // AIPromptの型を持つオブジェクトを作成
    const prompt: AIPrompt = {
      system: 'システムプロンプト',
      user: 'ユーザープロンプト'
    };

    // 型が正しく定義されていることを検証
    expect(prompt).toHaveProperty('system');
    expect(prompt).toHaveProperty('user');
  });

  it('AIResponseの型が正しく定義されていること', () => {
    // AIResponseの型を持つオブジェクトを作成
    const response: AIResponse = {
      testCode: 'const test = "example";',
      explanation: 'テストコードの説明'
    };

    // 型が正しく定義されていることを検証
    expect(response).toHaveProperty('testCode');
    expect(response).toHaveProperty('explanation');
  });
});
