## CHIP-8

chip8（CPUエミュレータ）をTypeScriptで実装してみた。

ブラウザで表示：  
https://hir-247-30.github.io/chip8.ts/

chip8自体の仕様：  
https://yukinarit.github.io/cowgod-chip8-tech-reference-ja/1_about_chip8.html

### 起動

```
npm ci

# CLIでプレイする
# 例えば npm run start BRIX でブロック崩しゲームを開始
npm run start [ROM名]

# ブラウザでプレイする
# コマンド実行後にpublic/index.htmlを開けば動作する
# 注意！ブラウザのCORSを一時的に無効化しておかないと、fetch()が失敗しプレイできない
npm run web
```

### 処理の流れ

```mermaid
sequenceDiagram
    participant ROM
    participant CPU
    participant メモリ
    participant プログラムカウンタ

    CPU->>ROM: 読み込み
    プログラムカウンタ->>プログラムカウンタ: 初期位置の設定
    CPU->>メモリ: フォントセットを読み込ませる
    CPU->>メモリ: ROMを読み込ませる
    CPU->>CPU: ディスプレイ表示
    loop
    CPU->>プログラムカウンタ: 位置を取得
    CPU->>メモリ: プログラムカウンタの位置から2バイトフェッチ
    CPU->>CPU: フェッチしたバイトから命令デコード
    CPU->>CPU: 命令を実行
    CPU->>CPU: ディスプレイ描画
    CPU->>CPU: タイマー更新
    CPU->>プログラムカウンタ: インクリメント
    end
```