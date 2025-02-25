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
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

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

// ===== テストコード =====

describe('askQuestion', () => {
  // readline.Interfaceのモック
  let mockReadline: any;

  beforeEach(() => {
    // readlineのモック
    mockReadline = {
      question: vi.fn().mockImplementation((question, callback) => {
        callback('モックの回答');
      }),
      close: vi.fn()
    };

    // readline.createInterfaceのモック
    vi.spyOn(readline, 'createInterface').mockReturnValue(mockReadline as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('ユーザーからの入力を取得できること', async () => {
    // 関数を実行
    const answer = await askQuestion('テスト質問');

    // 結果を検証
    expect(answer).toBe('モックの回答');
    expect(mockReadline.question).toHaveBeenCalledWith('テスト質問', expect.any(Function));
  });
});

describe('getTestScenario', () => {
  beforeEach(() => {
    // askQuestionのモック
    vi.spyOn(console, 'log').mockImplementation(() => {});
    
    // 異なる質問に対して異なる回答を返すモック
    let questionCount = 0;
    const mockAnswers = [
      'ログインページのテスト', // テストシナリオの説明
      'https://example.com/login', // URL
      'firefox', // ブラウザ
      'n', // ヘッドレスモード
      'y', // スクリーンショット
      '60000' // タイムアウト
    ];

    // askQuestionのモック
    vi.mock('../cli/index.js', () => {
      return {
        askQuestion: vi.fn().mockImplementation(() => {
          return Promise.resolve(mockAnswers[questionCount++]);
        })
      };
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('テストシナリオの入力を受け付けること', async () => {
    // この関数のテストは複雑なため、実際の実装では統合テストで行うか、
    // askQuestionをモックして個別にテストすることが望ましいです
    // ここでは簡易的なテストを示します
    
    // コンソール出力のモック
    vi.spyOn(console, 'log').mockImplementation(() => {});
    
    // askQuestionのモック（異なる質問に対して異なる回答を返す）
    const mockAskQuestion = vi.fn()
      .mockResolvedValueOnce('ログインページのテスト') // テストシナリオの説明
      .mockResolvedValueOnce('https://example.com/login') // URL
      .mockResolvedValueOnce('firefox') // ブラウザ
      .mockResolvedValueOnce('n') // ヘッドレスモード
      .mockResolvedValueOnce('y') // スクリーンショット
      .mockResolvedValueOnce('60000'); // タイムアウト
    
    try {
      // モック関数を設定
      vi.spyOn(global, 'askQuestion' as any).mockImplementation(mockAskQuestion);
      
      // 関数を実行
      const scenario = await getTestScenario();
      
      // 結果を検証
      expect(scenario).toEqual({
        description: 'ログインページのテスト',
        url: 'https://example.com/login',
        options: {
          browser: 'firefox',
          headless: false,
          screenshot: true,
          timeout: 60000
        }
      });
      
      // askQuestionが正しく呼び出されたことを検証
      expect(mockAskQuestion).toHaveBeenCalledTimes(6);
    } finally {
      // モックをリセット
      vi.restoreAllMocks();
    }
  });
});

describe('generateTest', () => {
  beforeEach(() => {
    // createPromptとgenerateTestCodeのモック
    vi.mock('../ai/index.js', () => ({
      createPrompt: vi.fn().mockReturnValue({
        system: 'システムプロンプト',
        user: 'ユーザープロンプト'
      }),
      generateTestCode: vi.fn().mockResolvedValue({
        testCode: 'const test = "example";',
        explanation: 'テストコードの説明'
      })
    }));
    
    // Date.nowのモック
    const originalDateNow = Date.now;
    Date.now = vi.fn().mockReturnValue(123456789);
    
    // コンソール出力のモック
    vi.spyOn(console, 'log').mockImplementation(() => {});
    
    return () => {
      // Date.nowを元に戻す
      Date.now = originalDateNow;
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('テストシナリオからテストコードを生成できること', async () => {
    // テスト用のシナリオを作成
    const scenario: TestScenario = {
      description: 'ログインページのテスト',
      url: 'https://example.com/login'
    };

    // 関数を実行
    const test = await generateTest(scenario);

    // 結果を検証
    expect(test).toEqual({
      code: 'const test = "example";',
      filename: 'test-123456789.spec.ts',
      explanation: 'テストコードの説明'
    });
    
    // createPromptとgenerateTestCodeが正しく呼び出されたことを検証
    expect(createPrompt).toHaveBeenCalledWith(scenario);
    expect(generateTestCode).toHaveBeenCalledWith({
      system: 'システムプロンプト',
      user: 'ユーザープロンプト'
    });
  });
});

describe('executeTest', () => {
  beforeEach(() => {
    // saveTestFileとrunTestのモック
    vi.mock('../playwright/index.js', () => ({
      saveTestFile: vi.fn().mockResolvedValue('/path/to/test.spec.ts'),
      runTest: vi.fn().mockResolvedValue({
        success: true,
        duration: 1234,
        logs: ['テスト実行結果']
      }),
      formatTestResult: vi.fn().mockReturnValue('フォーマットされたテスト結果')
    }));
    
    // askQuestionのモック
    vi.mock('../cli/index.js', () => {
      return {
        askQuestion: vi.fn().mockResolvedValue('y')
      };
    });
    
    // コンソール出力のモック
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('テストを実行できること', async () => {
    // テスト用のデータを作成
    const test: GeneratedTest = {
      code: 'const test = "example";',
      filename: 'test-example.spec.ts',
      explanation: 'テストコードの説明'
    };
    
    const scenario: TestScenario = {
      description: 'ログインページのテスト',
      url: 'https://example.com/login'
    };

    // askQuestionのモック（テスト実行を確認する）
    const mockAskQuestion = vi.fn().mockResolvedValue('y');
    
    try {
      // モック関数を設定
      vi.spyOn(global, 'askQuestion' as any).mockImplementation(mockAskQuestion);
      
      // 関数を実行
      await executeTest(test, scenario);
      
      // saveTestFileとrunTestが正しく呼び出されたことを検証
      expect(saveTestFile).toHaveBeenCalledWith(test);
      expect(runTest).toHaveBeenCalledWith('/path/to/test.spec.ts', undefined);
      expect(formatTestResult).toHaveBeenCalledWith({
        success: true,
        duration: 1234,
        logs: ['テスト実行結果']
      });
      
      // コンソール出力が正しく行われたことを検証
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('=== 生成されたテストコード ==='));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('=== AIによる説明 ==='));
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('=== テスト実行結果 ==='));
    } finally {
      // モックをリセット
      vi.restoreAllMocks();
    }
  });

  it('テスト実行をスキップできること', async () => {
    // テスト用のデータを作成
    const test: GeneratedTest = {
      code: 'const test = "example";',
      filename: 'test-example.spec.ts',
      explanation: 'テストコードの説明'
    };
    
    const scenario: TestScenario = {
      description: 'ログインページのテスト',
      url: 'https://example.com/login'
    };

    // askQuestionのモック（テスト実行をスキップする）
    const mockAskQuestion = vi.fn().mockResolvedValue('n');
    
    try {
      // モック関数を設定
      vi.spyOn(global, 'askQuestion' as any).mockImplementation(mockAskQuestion);
      
      // 関数を実行
      await executeTest(test, scenario);
      
      // saveTestFileとrunTestが呼び出されないことを検証
      expect(saveTestFile).not.toHaveBeenCalled();
      expect(runTest).not.toHaveBeenCalled();
      
      // コンソール出力が正しく行われたことを検証
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('テストの実行をスキップします'));
    } finally {
      // モックをリセット
      vi.restoreAllMocks();
    }
  });
});

describe('showHelp', () => {
  beforeEach(() => {
    // コンソール出力のモック
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('ヘルプメッセージを表示すること', () => {
    // 関数を実行
    showHelp();
    
    // コンソール出力が正しく行われたことを検証
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('E2Eテスト生成ツール'));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('使用方法:'));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('オプション:'));
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('説明:'));
  });
});

describe('showVersion', () => {
  beforeEach(() => {
    // コンソール出力のモック
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('バージョン情報を表示すること', () => {
    // 関数を実行
    showVersion();
    
    // コンソール出力が正しく行われたことを検証
    expect(console.log).toHaveBeenCalledWith('E2Eテスト生成ツール v0.1.0');
  });
});
