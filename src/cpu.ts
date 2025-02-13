import blessed from 'blessed';

const DISPLAY_WIDTH  = 64;
const DISPLAY_HEIGHT = 32;
const COLOR          = '#000000';

export class CPU {
    // レジスタ定義
    #memory        : Uint8Array;
    #registerV     : Uint8Array;
    #indexRegisterI: number;
    #programCounter: number;
    #stack         : Uint16Array;
    #stackPointer  : number;
    #delayTimer    : number;
    #soundTimer    : number;
    // フォントセット
    #FONTSET: number[] = [
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
    ];

    #screen: blessed.Widgets.Screen;
    #displayBuffer: number[][];

    #debug: boolean = false;

    constructor() {
        // レジスタ初期化
        this.#memory         = new Uint8Array(4096);
        this.#registerV      = new Uint8Array(16);
        this.#indexRegisterI = 0; // 16ビット
        this.#programCounter = 0x200; // プログラムは0x200から
        this.#stack          = new Uint16Array(16);
        this.#stackPointer   = 0; // 8ビット
        this.#delayTimer     = 0;
        this.#soundTimer     = 0;
        // ディスプレイ
        this.#screen = blessed.screen({
            title      : 'CHIP-8',
            autoPadding: true,
            smartCSR   : true,
            fg         : COLOR
        });
        this.#displayBuffer = this.#initDisplay();
    }

    // ROMを読み込む
    readRom (romBuffer: Buffer<ArrayBufferLike>) {
        // 511バイトまでフォントセットを埋める
        for (let i = 0; i < this.#FONTSET.length; i++) {
            this.#memory[i] = this.#FONTSET[i]
        }
        // 512バイトからROMを読み込ませる
        for (let i = 0; i < romBuffer.length; i++) {
            this.#memory[0x200 + i] = romBuffer[i];
        }
    }

    decrementTimers () {
        if (this.#delayTimer > 0) this.#delayTimer--;
        if (this.#soundTimer > 0) this.#soundTimer--;
    }

    // 命令コード実行
    update () {
        const opcode = this.#readOpCode();

        this.#programCounter += 2;

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

        const hexOrder = [c.toString(16), x.toString(16), y.toString(16), d.toString(16)].join('-');
        switch (opcode & 0xF000) {
            case 0x0000: {
                switch (opcode & 0x00FF) {
                    case 0x00E0:
                        this.#cls();
                        break;
                    case 0x00EE:
                        this.#ret();
                        break;
                    default:
                        console.log(`undefined opcode ${hexOrder}`);
                        return;
                };
            };
            case 0x1000:
                this.#jpAddr(nnn);
                break;
            case 0x2000:
                this.#callAddr(nnn);
                break;
            case 0x3000:
                this.#seVxByte(x, kk);
                break;
            case 0x4000:
                this.#sneVxByte(x, kk);
                break;
            case 0x5000:
                this.#seVxVy(x, y);
                break;
            case 0x6000:
                this.#ldVxByte(x, kk);
                break;
            case 0x7000:
                this.#addVxByte(x, kk);
                break;
            case 0x8000: {
                switch (opcode & 0x000F) {
                    case 0x0000:
                        this.#ldVxVy(x, y);
                        break;
                    case 0x0001:
                        this.#orVxVy(x, y);
                        break;
                    case 0x0002:
                        this.#andVxVy(x, y);
                        break;
                    case 0x0003:
                        this.#xorVxVy(x, y);
                        break;
                    case 0x0004:
                        this.#addVxVy(x, y);
                        break;
                    case 0x0005:
                        this.#subVxVy(x, y);
                        break;
                    case 0x0006:
                        this.#shrVx(x);
                        break;
                    case 0x0007:
                        this.#subnVxVy(x, y);
                        break;
                    case 0x000E:
                        this.#shlVx(x);
                        break;
                    default:
                        console.log(`undefined opcode ${hexOrder}`);
                        return;
                };
            };
            case 0x9000:
                this.#sneVxVy(x, y);
                break;
            case 0xA000:
                this.#ldIAddr(nnn);
                break;
            case 0xB000:
                this.#jpV0Addr(nnn);
                break;
            case 0xC000:
                this.#rndVxByte(x, kk);
                break;
            case 0xD000:
                this.#drwVxVyNibble(x, y, d);
                break;
            case 0xE000: {
                switch (opcode & 0x00FF) {
                    case 0x009E:
                        this.#skpVx(x);
                        break;
                    case 0x00A1:
                        this.#sknpVx(x);
                        break;
                    default:
                        console.log(`undefined opcode ${hexOrder}`);
                        return;
                };
            };
            case 0xF000: {
                switch (opcode & 0x00FF) {
                    case 0x0007:
                        this.#ldVxDt(x);
                        break;
                    case 0x000A:
                        this.#ldVxK(x);
                        break;
                    case 0x0015:
                        this.#ldDtVx(x);
                        break;
                    case 0x0018:
                        this.#ldStVx(x);
                        break;
                    case 0x001E:
                        this.#addIVx(x);
                        break;
                    case 0x0029:
                        this.#ldFVx(x);
                        break;
                    case 0x0033:
                        this.#ldBVx(x);
                        break;
                    case 0x0055:
                        this.#ldIVx(x);
                        break;
                    case 0x0065:
                        this.#ldVxI(x);
                        break;
                    default:
                        console.log(`undefined opcode ${hexOrder}`);
                        return;
                };
            };
            default:
                console.log(`undefined opcode ${hexOrder}`);
                return;
        }
        this.#debugDump(hexOrder);
    }

    #initDisplay () {
        let displayBuffer: number[][] = [];
        for (let i = 0; i < DISPLAY_WIDTH; i++) {
            displayBuffer[i] = [];
            for (let j = 0; j < DISPLAY_HEIGHT; j++) {
                displayBuffer[i].push(0);
            }
        }
        return displayBuffer;
    }

    // プログラムカウンタから2バイト読む
    #readOpCode () {
        const ahead = this.#memory[this.#programCounter];
        const back  = this.#memory[this.#programCounter + 1];

        // ビッグエンディアンに変換するため最初のバイトと二つ目のバイトを入れ替える
        // XXYYで例える
        // 1つ目のバイトはushortしたら00XX
        // 2つ目のバイトはushortしたら00YY
        // 1つ目を1バイト（8ビット）左シフトさせて論理和を取ればXXYYにできる
        return ahead << 8 | back;
    }

    #cls () {
        this.#displayBuffer = this.#initDisplay();
        this.#screen.clearRegion(0, DISPLAY_WIDTH, 0, DISPLAY_HEIGHT);
    }

    #ret () {
        this.#programCounter = this.#stack[this.#stackPointer];
        this.#stackPointer--;
    }

    #jpAddr (nnn: number) {
        this.#programCounter = nnn;
    }

    #callAddr (nnn: number) {
        this.#stackPointer++;
        this.#stack[this.#stackPointer] = this.#programCounter;
        this.#programCounter = nnn;
    }

    #seVxByte (x: number, kk: number) {
        if (this.#registerV[x] === kk) this.#programCounter += 2;
    }

    #sneVxByte (x: number, kk: number) {
        if (this.#registerV[x] !== kk) this.#programCounter += 2;
    }

    #seVxVy (x: number, y: number) {
        if (this.#registerV[x] === this.#registerV[y]) this.#programCounter += 2;
    }

    #ldVxByte (x: number, kk: number) {
        this.#registerV[x] = kk;
    }

    #addVxByte (x: number, kk: number) {
        this.#registerV[x] += kk;
    }
    
    #ldVxVy (x: number, y: number) {
        this.#registerV[x] = this.#registerV[y];
    }

    #orVxVy (x: number, y: number) {
        this.#registerV[x] |= this.#registerV[y];
    }

    #andVxVy (x: number, y: number) {
        this.#registerV[x] &= this.#registerV[y];
    }

    #xorVxVy (x: number, y: number) {
        this.#registerV[x] ^= this.#registerV[y];
    }

    #addVxVy (x: number, y: number) {
        this.#registerV[x] += this.#registerV[y];
        this.#registerV[0xF] = (this.#registerV[x] > 0xFF) ? 1 : 0;
    }

    #subVxVy (x: number, y: number) {
        this.#registerV[0xF] = (this.#registerV[x] > this.#registerV[y]) ? 1 : 0;
        this.#registerV[x] -= this.#registerV[y];
    }

    #shrVx (x: number) {
        this.#registerV[0xF] = (this.#registerV[x] & 0x1) ? 1 : 0;
        this.#registerV[x] >>= 1;
    }

    #subnVxVy (x: number, y: number) {
        this.#registerV[0xF] = (this.#registerV[y] > this.#registerV[x]) ? 1 : 0;
        this.#registerV[x] = this.#registerV[y] - this.#registerV[x];
    }

    #shlVx (x: number) {
        this.#registerV[0xF] = (this.#registerV[x] & 0x80) ? 1 : 0;
        this.#registerV[x] <<= 1;
    }

    #sneVxVy (x: number, y: number) {
        this.#programCounter += (this.#registerV[x] !== this.#registerV[y]) ? 2 : 0;
    }

    #ldIAddr (nnn: number) {
        this.#indexRegisterI = nnn;
    }

    #jpV0Addr (nnn: number) {
        this.#programCounter = nnn + this.#registerV[0];
    }

    #rndVxByte (x: number, kk: number) {
        this.#registerV[x] = Math.floor(Math.random() * 0xFF) & kk;
    }

    // dもnも一緒に扱ってOK
    #drwVxVyNibble (x: number, y: number, n: number) {
        this.#registerV[0xf] = 0;

        for (let byteOffset = 0; byteOffset < n; byteOffset++) {
            let byte = this.#memory[this.#indexRegisterI + byteOffset];
            for (let bitOffset = 0; bitOffset < 8; bitOffset++) {
                let bit = (byte >> (7 - bitOffset)) & 0x1;
                let currX = (this.#registerV[x] + bitOffset) % DISPLAY_WIDTH;
                let currY = (this.#registerV[y] + byteOffset) % DISPLAY_HEIGHT;

                const collision = this.#displayBuffer[y][x] & bit;
                this.#displayBuffer[currY][currX] ^= bit;

                if (this.#displayBuffer[currY][currX]) {
                    this.#screen.fillRegion(COLOR, '#', currX, currX + 1, currY, currY + 1);
                } else {
                    this.#screen.clearRegion(currX, currX + 1, currY, currY + 1);
                }
                this.#screen.render();

                // 消されたピクセルが一つでもある場合はVfに1、それ以外の場合は0をセットする
                if (collision) this.#registerV[0xf] = 1;
            }
        }
    }

    #skpVx (x: number) {
        // @TODO
        // キーボードををチェックし、Vxの値のキーが押されていればプログラムカウンタを2インクリメントする。
    }

    #sknpVx (x: number) {
        // @TODO
        // キーボードをチェックし、Vxの値のキーが押されていればプログラムカウンタを2インクリメントする。
    }

    #ldVxDt (x: number) {
        this.#registerV[x] = this.#delayTimer;
    }

    #ldVxK (x: number) {
        // @TODO
        // 押されたキーをVxにセットする。
        // キーが入力されるまで全ての実行をストップする。キーが押されるとその値をVxにセットする。
    }

    #ldDtVx (x: number) {
        this.#delayTimer = this.#registerV[x];
    }

    #ldStVx (x: number) {
        this.#soundTimer = this.#registerV[x];
    }

    #addIVx (x: number) {
        this.#indexRegisterI += this.#registerV[x];
    }

    #ldFVx (x: number) {
        // @TODO
        // Vxの値に対応するスプライト(fontset)のアドレスをセットする
    }

    #ldBVx (x: number) {
        let v = this.#registerV[x];
        const B = Math.floor(v / 100);

        v = v - B * 100;
        const C = Math.floor(v / 10);

        v = v - C * 10;
        const D = Math.floor(v);

        this.#memory[this.#indexRegisterI]     = B;
        this.#memory[this.#indexRegisterI + 1] = C;
        this.#memory[this.#indexRegisterI + 2] = D;
    }

    #ldIVx (x: number) {
        for (let i = 0; i <= x; i++) {
            this.#memory[this.#indexRegisterI + i] = this.#registerV[i];
        }
    }

    #ldVxI (x: number) {
        for (let i = 0; i <= x; i++) {
            this.#registerV[i] = this.#memory[this.#indexRegisterI + i];
        }
    }

    #debugDump (joinedOrder: string) {
        if (!this.#debug) return;

        const dumpArray = {
            'Order': joinedOrder,
            'V'    : this.#registerV,
            'I'    : this.#indexRegisterI,
            'PG'   : this.#programCounter,
            'Stack': this.#stack,
            'SP'   : this.#stackPointer,
            'DT'   : this.#delayTimer,
            'ST'   : this.#soundTimer,
        }
        console.log(dumpArray);
    }
}