/**
 * E2Eテスト生成ツールの型定義
 *
 * このファイルでは、AIを活用したE2Eテスト生成ツールで使用する型を定義します。
 * テストシナリオ、AIレスポンス、Playwrightテストコードなどの型を含みます。
 */

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
	browser?: "chromium" | "firefox" | "webkit";
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
