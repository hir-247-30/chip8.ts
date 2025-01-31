class CPU {
    // レジスタ定義
    memory        : Uint8Array;
    registerV     : Uint8Array;
    indexRegisterI: number;
    programCounter: number
    stack         : Uint16Array
    stackPointer  : number
    delayTimer    : number
    soundTimer    : number
    // フォントセット
    FONTSET: number[] = [
        0xF0, 0x90, 0x90, 0x90, 0xF0, // 0
        0x20, 0x60, 0x20, 0x20, 0x70, // 1
        0xF0, 0x10, 0xF0, 0x80, 0xF0, // 2
        0xF0, 0x10, 0xF0, 0x10, 0xF0, // 3
        0x90, 0x90, 0xF0, 0x10, 0x10, // 4
        0xF0, 0x80, 0xF0, 0x10, 0xF0, // 5
        0xF0, 0x80, 0xF0, 0x90, 0xF0, // 6
        0xF0, 0x10, 0x20, 0x40, 0x40, // 7
        0xF0, 0x90, 0xF0, 0x90, 0xF0, // 8
        0xF0, 0x90, 0xF0, 0x10, 0xF0, // 9
        0xF0, 0x90, 0xF0, 0x90, 0x90, // A
        0xE0, 0x90, 0xE0, 0x90, 0xE0, // B
        0xF0, 0x80, 0x80, 0x80, 0xF0, // C
        0xE0, 0x90, 0x90, 0x90, 0xE0, // D
        0xF0, 0x80, 0xF0, 0x80, 0xF0, // E
        0xF0, 0x80, 0xF0, 0x80, 0x80, // F
    ]

    constructor() {
        // レジスタ初期化
        this.memory         = new Uint8Array(4096);
        this.registerV      = new Uint8Array(16);
        this.indexRegisterI = 0; // 16ビット
        this.programCounter = 0x200; // プログラムは0x200から
        this.stack          = new Uint16Array(16);
        this.stackPointer   = 0; // 8ビット
        this.delayTimer     = 0;
        this.soundTimer     = 0;
    }

    // ROMを読み込む
    readRom () {
        // 511バイトまでフォントセットを埋める
        for (let i = 0; i < this.FONTSET.length; i++) {
            this.memory[i] = this.FONTSET[i]
        }
        // 512バイトからはROMを読み込ませる
    }

    // 命令コード読み込み
    // リトルエンディアン→ビッグエンディアンに変換するため最初のバイトと二つ目のバイトを入れ替える
    // c, k, y, d に分割する
    // nnn と kk を抽出する
    // 命令実行

    // タイマー実装
}