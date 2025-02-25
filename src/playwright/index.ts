/**
 * Playwright関連の処理を行うモジュール
 * 
 * このファイルでは、Playwrightを使用してE2Eテストを実行する機能を提供します。
 * 生成されたテストコードをファイルに保存し、Playwrightを使用してテストを実行します。
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { GeneratedTest, TestOptions, TestResult } from '../types/index.js';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const execPromise = promisify(exec);

// テストファイルを保存するディレクトリ
const TEST_DIR = path.join(process.cwd(), 'tests');

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
    await fs.writeFile(filePath, test.code, 'utf-8');

    console.log(`テストファイルを保存しました: ${filePath}`);
    return filePath;
  } catch (error) {
    console.error('テストファイルの保存中にエラーが発生しました:', error);
    throw new Error(`テストファイルの保存に失敗しました: ${(error as Error).message}`);
  }
}

/**
 * Playwrightを使用してテストを実行する
 * @param testFilePath テストファイルのパス
 * @param options テストオプション
 * @returns テスト実行結果
 */
export async function runTest(testFilePath: string, options?: TestOptions): Promise<TestResult> {
  try {
    const startTime = Date.now();
    const logs: string[] = [];

    // テストコマンドを構築
    let command = 'npx playwright test';

    // テストファイルのパスを追加
    command += ` ${testFilePath}`;

    // ブラウザオプションを追加
    if (options?.browser) {
      command += ` --project=${options.browser}`;
    }

    // ヘッドレスモードオプションを追加
    if (options?.headless === false) {
      command += ' --headed';
    }

    // タイムアウトオプションを追加
    if (options?.timeout) {
      command += ` --timeout=${options.timeout}`;
    }

    logs.push(`実行コマンド: ${command}`);

    try {
      // テストを実行
      const { stdout, stderr } = await execPromise(command);
      logs.push('標準出力:');
      logs.push(stdout);

      if (stderr) {
        logs.push('標準エラー出力:');
        logs.push(stderr);
      }

      const duration = Date.now() - startTime;
      return {
        success: true,
        duration,
        logs,
      };
    } catch (error) {
      const execError = error as { stdout?: string; stderr?: string; message?: string };
      
      if (execError.stdout) {
        logs.push('標準出力:');
        logs.push(execError.stdout);
      }
      
      if (execError.stderr) {
        logs.push('標準エラー出力:');
        logs.push(execError.stderr);
      }

      const duration = Date.now() - startTime;
      return {
        success: false,
        duration,
        error: execError.message || 'テスト実行中にエラーが発生しました',
        logs,
      };
    }
  } catch (error) {
    console.error('テスト実行中にエラーが発生しました:', error);
    throw new Error(`テスト実行に失敗しました: ${(error as Error).message}`);
  }
}

/**
 * テスト結果を整形して表示する
 * @param result テスト実行結果
 * @returns 整形されたテスト結果
 */
export function formatTestResult(result: TestResult): string {
  let output = '';

  if (result.success) {
    output += '✅ テストが成功しました\n';
  } else {
    output += '❌ テストが失敗しました\n';
    if (result.error) {
      output += `エラー: ${result.error}\n`;
    }
  }

  output += `実行時間: ${result.duration}ms\n\n`;

  output += '--- ログ ---\n';
  output += result.logs.join('\n');

  return output;
}

/**
 * スクリーンショットを撮影する
 * @param testName テスト名
 * @param page Playwrightのページオブジェクト
 * @returns スクリーンショットのパス
 */
export async function takeScreenshot(testName: string, page: any): Promise<string> {
  try {
    // スクリーンショットディレクトリが存在しない場合は作成
    const screenshotDir = path.join(process.cwd(), 'screenshots');
    await fs.mkdir(screenshotDir, { recursive: true });

    // スクリーンショットのファイル名を生成
    const filename = `${testName}-${Date.now()}.png`;
    const filePath = path.join(screenshotDir, filename);

    // スクリーンショットを撮影
    await page.screenshot({ path: filePath, fullPage: true });

    console.log(`スクリーンショットを保存しました: ${filePath}`);
    return filePath;
  } catch (error) {
    console.error('スクリーンショットの撮影中にエラーが発生しました:', error);
    throw new Error(`スクリーンショットの撮影に失敗しました: ${(error as Error).message}`);
  }
}

// ===== テストコード =====

describe('saveTestFile', () => {
  // モックの設定
  beforeEach(() => {
    // fs.mkdirとfs.writeFileのモック
    vi.mock('fs/promises', () => ({
      mkdir: vi.fn().mockResolvedValue(undefined),
      writeFile: vi.fn().mockResolvedValue(undefined)
    }));
    
    // consoleのモック
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  // モックのリセット
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('テストファイルを正常に保存できること', async () => {
    // テスト用のデータを作成
    const test: GeneratedTest = {
      code: 'const test = "example";',
      filename: 'test-example.spec.ts'
    };

    // 関数を実行
    const filePath = await saveTestFile(test);

    // 結果を検証
    expect(filePath).toContain('test-example.spec.ts');
    expect(fs.mkdir).toHaveBeenCalledWith(expect.any(String), { recursive: true });
    expect(fs.writeFile).toHaveBeenCalledWith(
      expect.stringContaining('test-example.spec.ts'),
      'const test = "example";',
      'utf-8'
    );
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('テストファイルを保存しました'));
  });

  it('ファイル名が指定されていない場合はデフォルト名を使用すること', async () => {
    // Date.nowのモック
    const originalDateNow = Date.now;
    Date.now = vi.fn().mockReturnValue(123456789);

    // テスト用のデータを作成（ファイル名なし）
    const test: GeneratedTest = {
      code: 'const test = "example";',
      filename: ''
    };

    try {
      // 関数を実行
      const filePath = await saveTestFile(test);

      // 結果を検証
      expect(filePath).toContain('test-123456789.spec.ts');
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('test-123456789.spec.ts'),
        expect.any(String),
        'utf-8'
      );
    } finally {
      // Date.nowを元に戻す
      Date.now = originalDateNow;
    }
  });

  it('エラーが発生した場合は適切に処理すること', async () => {
    // fs.mkdirのモックをエラーを投げるように設定
    vi.mocked(fs.mkdir).mockRejectedValue(new Error('ディレクトリの作成に失敗しました'));

    // テスト用のデータを作成
    const test: GeneratedTest = {
      code: 'const test = "example";',
      filename: 'test-example.spec.ts'
    };

    // 関数の実行とエラーの検証
    await expect(saveTestFile(test)).rejects.toThrow('テストファイルの保存に失敗しました');
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('テストファイルの保存中にエラーが発生しました'),
      expect.any(Error)
    );
  });
});

describe('runTest', () => {
  // モックの設定
  beforeEach(() => {
    // execPromiseのモック
    vi.mock('util', () => ({
      promisify: vi.fn().mockImplementation((fn) => {
        return vi.fn().mockResolvedValue({ stdout: 'テスト実行結果', stderr: '' });
      })
    }));
    
    // consoleのモック
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  // モックのリセット
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('テストを正常に実行できること', async () => {
    // 関数を実行
    const result = await runTest('/path/to/test.spec.ts');

    // 結果を検証
    expect(result.success).toBe(true);
    expect(result.logs).toContain('実行コマンド: npx playwright test /path/to/test.spec.ts');
    expect(result.logs).toContain('標準出力:');
    expect(result.logs).toContain('テスト実行結果');
  });

  it('オプション付きでテストを実行できること', async () => {
    // テストオプションを作成
    const options: TestOptions = {
      browser: 'firefox',
      headless: false,
      timeout: 60000
    };

    // 関数を実行
    const result = await runTest('/path/to/test.spec.ts', options);

    // 結果を検証
    expect(result.success).toBe(true);
    expect(result.logs).toContain('実行コマンド: npx playwright test /path/to/test.spec.ts --project=firefox --headed --timeout=60000');
  });

  it('テスト実行中にエラーが発生した場合は適切に処理すること', async () => {
    // execPromiseのモックをエラーを投げるように設定
    vi.mock('util', () => ({
      promisify: vi.fn().mockImplementation((fn) => {
        return vi.fn().mockRejectedValue({
          stdout: 'エラー出力',
          stderr: 'テスト実行中にエラーが発生しました',
          message: 'コマンド実行エラー'
        });
      })
    }));

    // 関数を実行
    const result = await runTest('/path/to/test.spec.ts');

    // 結果を検証
    expect(result.success).toBe(false);
    expect(result.error).toBe('コマンド実行エラー');
    expect(result.logs).toContain('標準出力:');
    expect(result.logs).toContain('エラー出力');
    expect(result.logs).toContain('標準エラー出力:');
    expect(result.logs).toContain('テスト実行中にエラーが発生しました');
  });
});

describe('formatTestResult', () => {
  it('成功したテスト結果を正しくフォーマットすること', () => {
    // テスト結果を作成
    const result: TestResult = {
      success: true,
      duration: 1234,
      logs: ['コマンド実行', 'テスト成功']
    };

    // 関数を実行
    const formatted = formatTestResult(result);

    // 結果を検証
    expect(formatted).toContain('✅ テストが成功しました');
    expect(formatted).toContain('実行時間: 1234ms');
    expect(formatted).toContain('コマンド実行');
    expect(formatted).toContain('テスト成功');
  });

  it('失敗したテスト結果を正しくフォーマットすること', () => {
    // テスト結果を作成
    const result: TestResult = {
      success: false,
      duration: 1234,
      error: 'テストが失敗しました',
      logs: ['コマンド実行', 'テスト失敗']
    };

    // 関数を実行
    const formatted = formatTestResult(result);

    // 結果を検証
    expect(formatted).toContain('❌ テストが失敗しました');
    expect(formatted).toContain('エラー: テストが失敗しました');
    expect(formatted).toContain('実行時間: 1234ms');
    expect(formatted).toContain('コマンド実行');
    expect(formatted).toContain('テスト失敗');
  });
});

describe('takeScreenshot', () => {
  // モックの設定
  beforeEach(() => {
    // fs.mkdirのモック
    vi.mock('fs/promises', () => ({
      mkdir: vi.fn().mockResolvedValue(undefined)
    }));
    
    // consoleのモック
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  // モックのリセット
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('スクリーンショットを正常に撮影できること', async () => {
    // Date.nowのモック
    const originalDateNow = Date.now;
    Date.now = vi.fn().mockReturnValue(123456789);

    // モックページオブジェクトを作成
    const mockPage = {
      screenshot: vi.fn().mockResolvedValue(undefined)
    };

    try {
      // 関数を実行
      const filePath = await takeScreenshot('login-test', mockPage);

      // 結果を検証
      expect(filePath).toContain('login-test-123456789.png');
      expect(fs.mkdir).toHaveBeenCalledWith(expect.stringContaining('screenshots'), { recursive: true });
      expect(mockPage.screenshot).toHaveBeenCalledWith({
        path: expect.stringContaining('login-test-123456789.png'),
        fullPage: true
      });
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('スクリーンショットを保存しました'));
    } finally {
      // Date.nowを元に戻す
      Date.now = originalDateNow;
    }
  });

  it('スクリーンショット撮影中にエラーが発生した場合は適切に処理すること', async () => {
    // モックページオブジェクトを作成（エラーを投げる）
    const mockPage = {
      screenshot: vi.fn().mockRejectedValue(new Error('スクリーンショットの撮影に失敗しました'))
    };

    // 関数の実行とエラーの検証
    await expect(takeScreenshot('login-test', mockPage)).rejects.toThrow('スクリーンショットの撮影に失敗しました');
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('スクリーンショットの撮影中にエラーが発生しました'),
      expect.any(Error)
    );
  });
});
