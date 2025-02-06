export class CPU {
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
    readRom (romBuffer: Buffer<ArrayBufferLike>) {
        // 511バイトまでフォントセットを埋める
        for (let i = 0; i < this.FONTSET.length; i++) {
            this.memory[i] = this.FONTSET[i]
        }
        // 512バイトからROMを読み込ませる
        for (let i = 0; i < romBuffer.length; i++) {
            this.memory[0x200 + i] = romBuffer[i];
        }
    }

    // 命令コード実行
    update () {
        console.log('tick');

        const opcode = this._readOpCode();

        this.programCounter += 2;

        // c x y d に命令コードを分割
        // ニブルという概念を使う

        // 0x73EE という命令コードがあるとする
        // 73が上位バイト EEが下位バイト
        // それぞれのうち、1つ目が上位ニブル、2つ目が下位ニブル

        // c 上位バイトの上位ニブル
        // x 上位バイトの下位ニブル
        // y 下位バイトの上位ニブル
        // d 下位バイトの下位ニブル
        // kk 下位バイト
        // nnn 下位バイトと上位の下位ニブル
        const c   = ((opcode & 0xF000) >> 12);
        const x   = ((opcode & 0x0F00) >> 8);
        const y   = ((opcode & 0x00F0) >> 4);
        const d   = ((opcode & 0x000F) >> 0);
        const nnn = (opcode & 0x0FFF);
        const kk  = (opcode & 0x00FF);

        // 命令実行
        const splitOpcode = {
            c,
            x,
            y,
            d,
            nnn,
            kk
        };
        this._executeOrder(splitOpcode);
    }

    // プログラムカウンタから2バイト読む
    _readOpCode () {
        const ahead = this.memory[this.programCounter];
        const back  = this.memory[this.programCounter + 1];

        // ビッグエンディアンに変換するため最初のバイトと二つ目のバイトを入れ替える
        // XXYYで例える
        // 1つ目のバイトはushortしたら00XX
        // 2つ目のバイトはushortしたら00YY
        // 1つ目を1バイト（8ビット）左シフトさせて論理和を取ればXXYYにできる
        return ahead << 8 | back;
    }

    // 命令
    _executeOrder (splitOpcode: {
        // @TODO 型
        c: number,
        x: number,
        y: number,
        d: number,
        nnn: number,
        kk: number
    }) {
        const {
            c,
            x,
            y,
            d,
            nnn,
            kk
        } = splitOpcode;

        switch ([c, x, y, d].join('-')) {
            case '0-0-E-0':
              this._cls();
              break;
            default:
              console.log(`opcode ${[c, x, y, d].join('-')}`);
          }
    }

    _cls () {
        // ディスプレイクリア
    }

    // タイマー実装
}