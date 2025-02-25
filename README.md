# E2Eテスト生成ツール

AIを活用し、対話式で自動的にPlaywright用のE2Eテストを生成するツールです。

## 概要

このツールは、自然言語でテストシナリオを入力するだけで、AIがPlaywrightのテストコードを自動生成し、実行することができます。非エンジニアでもテスト作成ができ、テストのメンテナンスコストを大幅に削減します。

## 機能

- 自然言語によるテスト記述
- AIによるPlaywrightテストコード生成
- 生成されたテストコードの自動実行
- 対話式インターフェース

## インストール

```bash
# リポジトリをクローン
git clone https://github.com/yourusername/e2e-test-generator.git
cd e2e-test-generator

# 依存関係をインストール
pnpm install

# .envファイルを作成し、Anthropic APIキーを設定
echo "API_KEY=your_anthropic_api_key" > .env

# ビルド
pnpm run build
```

## 使い方

```bash
# ツールを実行
pnpm start
```

実行すると、以下のような対話式インターフェースが表示されます：

1. テストシナリオを自然言語で入力（例：「ログインページにアクセスして、ユーザー名とパスワードを入力し、ログインボタンをクリックすると、ダッシュボードに遷移すること」）
2. テスト対象のURLを入力（省略可能）
3. テストオプションを設定（ブラウザ、ヘッドレスモード、スクリーンショット、タイムアウト）
4. AIがテストコードを生成
5. 生成されたテストコードと説明が表示される
6. テストを実行するかどうかを選択
7. テスト結果が表示される

## 例

```
=== E2Eテスト生成ツール ===
テストシナリオを入力してください。AIがPlaywrightのテストコードを生成します。

テストシナリオの説明（自然言語）: GET STARTEDのボタンを押下すると、https://playwright.dev/docs/introに遷移すること
テスト対象のURL（省略可能）: https://playwright.dev/
ブラウザ（chromium/firefox/webkit、デフォルト: chromium）:
ヘッドレスモード（y/n、デフォルト: y）:
スクリーンショットを撮影（y/n、デフォルト: n）:
タイムアウト（ミリ秒、デフォルト: 30000）:

AIによるテストコード生成中...

=== 生成されたテストコード ===
import { test, expect } from '@playwright/test';

test('GET STARTEDボタンを押下してイントロページに遷移する', async ({ page }) => {
  // テスト対象のURLに移動
  await page.goto('https://playwright.dev/');

  // "GET STARTED"ボタンをクリック
  await page.getByRole('link', { name: 'Get started' }).click();

  // https://playwright.dev/docs/intro ページに遷移したことを確認
  await expect(page).toHaveURL('https://playwright.dev/docs/intro');
});

=== AIによる説明 ===
このテストコードでは以下の内容を実行しています：
...

テストを実行しますか？（y/n）: y
```

## 注意事項

- Anthropic APIキーが必要です
- Playwrightがインストールされている必要があります
- テスト実行にはインターネット接続が必要です

## ライセンス

MIT
