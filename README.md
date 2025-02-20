## CHIP-8

chip8（CPUエミュレータ）をTypeScriptで実装してみた。

chip8自体の仕様は下記参照：
https://yukinarit.github.io/cowgod-chip8-tech-reference-ja/1_about_chip8.html

### 起動

```
# 例えば npm run start BRIX でブロック崩しゲームを開始
npm run start [ROM名]
```

### 処理の流れ

```mermaid
sequenceDiagram
    participant ROM
    participant CPU
    participant メモリ
    participant プログラムカウンタ

    CPU->>ROM: 読み込み
    CPU->>メモリ: フォントセットを読み込ませる
    CPU->>メモリ: ROMを読み込ませる
    CPU->>CPU: ディスプレイ表示
    loop
    CPU->>メモリ: プログラムカウンタの位置から2バイトフェッチ
    CPU->>CPU: フェッチしたバイトから命令デコード
    CPU->>CPU: 命令を実行
    CPU->>CPU: ディスプレイ描画
    CPU->>CPU: タイマー更新
    CPU->>プログラムカウンタ: インクリメント
    end
```