#!/usr/bin/env node
/**
 * E2Eテスト生成ツールのメインエントリーポイント
 * 
 * このファイルでは、コマンドライン引数を解析し、
 * ヘルプやバージョン情報の表示、またはCLIの実行を行います。
 */

import * as dotenv from 'dotenv';
import { runCLI, showHelp, showVersion } from './cli/index.js';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// 環境変数の読み込み
dotenv.config();

/**
 * メイン関数
 * コマンドライン引数を解析し、適切な処理を実行する
 */
async function main() {
  const args = process.argv.slice(2);
  
  // コマンドライン引数がない場合、またはヘルプが指定された場合
  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    return;
  }
  
  // バージョン情報が指定された場合
  if (args.includes('--version') || args.includes('-v')) {
    showVersion();
    return;
  }
  
  // CLIの実行
  await runCLI();
}

// メイン関数の実行
main().catch((error) => {
  console.error('予期せぬエラーが発生しました:', error);
  process.exit(1);
});

// ===== テストコード =====

describe('main関数', () => {
  beforeEach(() => {
    // process.argvのモック
    vi.spyOn(process, 'argv', 'get').mockReturnValue(['node', 'index.js']);
    
    // dotenv.configのモック
    vi.mock('dotenv', () => ({
      config: vi.fn()
    }));
    
    // CLIモジュールのモック
    vi.mock('./cli/index.js', () => ({
      runCLI: vi.fn().mockResolvedValue(undefined),
      showHelp: vi.fn(),
      showVersion: vi.fn()
    }));
    
    // コンソール出力のモック
    vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // process.exitのモック
    vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`Process exit with code: ${code}`);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('引数がない場合はrunCLIを実行すること', async () => {
    // process.argvのモック（引数なし）
    vi.spyOn(process, 'argv', 'get').mockReturnValue(['node', 'index.js']);
    
    // 関数を実行
    await main();
    
    // runCLIが呼び出されたことを検証
    expect(runCLI).toHaveBeenCalled();
    expect(showHelp).not.toHaveBeenCalled();
    expect(showVersion).not.toHaveBeenCalled();
  });

  it('--helpオプションが指定された場合はshowHelpを実行すること', async () => {
    // process.argvのモック（--helpオプション）
    vi.spyOn(process, 'argv', 'get').mockReturnValue(['node', 'index.js', '--help']);
    
    // 関数を実行
    await main();
    
    // showHelpが呼び出されたことを検証
    expect(showHelp).toHaveBeenCalled();
    expect(runCLI).not.toHaveBeenCalled();
    expect(showVersion).not.toHaveBeenCalled();
  });

  it('-hオプションが指定された場合はshowHelpを実行すること', async () => {
    // process.argvのモック（-hオプション）
    vi.spyOn(process, 'argv', 'get').mockReturnValue(['node', 'index.js', '-h']);
    
    // 関数を実行
    await main();
    
    // showHelpが呼び出されたことを検証
    expect(showHelp).toHaveBeenCalled();
    expect(runCLI).not.toHaveBeenCalled();
    expect(showVersion).not.toHaveBeenCalled();
  });

  it('--versionオプションが指定された場合はshowVersionを実行すること', async () => {
    // process.argvのモック（--versionオプション）
    vi.spyOn(process, 'argv', 'get').mockReturnValue(['node', 'index.js', '--version']);
    
    // 関数を実行
    await main();
    
    // showVersionが呼び出されたことを検証
    expect(showVersion).toHaveBeenCalled();
    expect(runCLI).not.toHaveBeenCalled();
    expect(showHelp).not.toHaveBeenCalled();
  });

  it('-vオプションが指定された場合はshowVersionを実行すること', async () => {
    // process.argvのモック（-vオプション）
    vi.spyOn(process, 'argv', 'get').mockReturnValue(['node', 'index.js', '-v']);
    
    // 関数を実行
    await main();
    
    // showVersionが呼び出されたことを検証
    expect(showVersion).toHaveBeenCalled();
    expect(runCLI).not.toHaveBeenCalled();
    expect(showHelp).not.toHaveBeenCalled();
  });

  it('エラーが発生した場合は適切に処理すること', async () => {
    // runCLIのモックをエラーを投げるように設定
    vi.mocked(runCLI).mockRejectedValue(new Error('テストエラー'));
    
    // 関数の実行とエラーの検証
    await expect(main()).rejects.toThrow('Process exit with code: 1');
    
    // エラーメッセージが表示されたことを検証
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('予期せぬエラーが発生しました'),
      expect.any(Error)
    );
    expect(process.exit).toHaveBeenCalledWith(1);
  });
});
