#!/usr/bin/env node
/**
 * E2Eテスト生成ツールのメインエントリーポイント
 * 
 * このファイルでは、コマンドライン引数を解析し、
 * ヘルプやバージョン情報の表示、またはCLIの実行を行います。
 */

import * as dotenv from 'dotenv';
import { runCLI, showHelp, showVersion } from './cli/index.js';

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
