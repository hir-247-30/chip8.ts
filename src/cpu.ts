import pino from 'pino';
import { Display } from './display';
import { DISPLAY_WIDTH, DISPLAY_HEIGHT, u8, u16 } from './common';

export class CPU {
    // レジスタ定義
    memory        : Uint8Array;
    registerV     : Uint8Array;
    indexRegisterI: u16;
    programCounter: u16;
    stack         : Uint16Array;
    stackPointer  : u8;
    delayTimer    : u8;
    soundTimer    : u8;
    #fontset      : Uint8Array;

    // ディスプレイ
    display: Display;

    #debug : boolean = false;
    #logger: pino.BaseLogger|undefined;

    constructor () {
        // レジスタ初期化
        this.memory         = new Uint8Array(4096);
        this.registerV      = new Uint8Array(16);
        this.indexRegisterI = u16(0);
        this.programCounter = u16(0x200); // プログラムは0x200から
        this.stack          = new Uint16Array(16);
        this.stackPointer   = u8(0);
        this.delayTimer     = u8(0);
        this.soundTimer     = u8(0);
        this.#fontset       = new Uint8Array([
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
        ]);
        
        this.display = new Display();

        if(this.#debug) {
            this.#logger = pino({
                level: 'trace',
                transport: {
                    target: 'pino/file',
                    options: {
                        destination: 'logs/debug.log',
                        mkdir: true
                    }
                }
            });
        }
    }

    // ROMを読み込む
    readRom (romBuffer: Buffer<ArrayBufferLike>) {
        // 511バイトまでフォントセットを埋める
        for (let i = 0; i < this.#fontset.length; i++) {
            this.memory[i] = this.#fontset[i];
        }
        // 512バイトからROMを読み込ませる
        for (let i = 0; i < romBuffer.length; i++) {
            this.memory[0x200 + i] = romBuffer[i];
        }
    }

    decrementTimers () {
        if (this.delayTimer > 0) this.delayTimer--;
        if (this.soundTimer > 0) this.soundTimer--;
    }

    // 命令コード実行
    update () {
        this.display.renderDisplay();

        const opcode = this._readOpCode();
        this.programCounter = u16(this.programCounter + 2);

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
        this.#debugDump(hexOrder);

        switch (opcode & 0xF000) {
            case 0x0000: return this._handle0({ opcode, hexOrder });
            case 0x1000: return this._jpAddr(nnn);
            case 0x2000: return this._callAddr(nnn);
            case 0x3000: return this._seVxByte({ x, kk });
            case 0x4000: return this._sneVxByte({ x, kk });
            case 0x5000: return this._seVxVy({ x, y });
            case 0x6000: return this._ldVxByte({ x, kk });
            case 0x7000: return this._addVxByte({ x, kk });
            case 0x8000: return this._handle8({ x, y, opcode, hexOrder });
            case 0x9000: return this._sneVxVy({ x, y });
            case 0xA000: return this._ldIAddr(nnn);
            case 0xB000: return this._jpV0Addr(nnn);
            case 0xC000: return this._rndVxByte({ x, kk });
            case 0xD000: return this._drwVxVyNibble({ x, y, n: d });
            case 0xE000: return this._handleE({ x, opcode, hexOrder });
            case 0xF000: return this._handleF({ x, opcode, hexOrder });
            default: throw new Error(`undefined opcode ${hexOrder}`);
        }
    }

    _handle0 (args: { opcode: number, hexOrder: string}) {
        const { opcode, hexOrder } = args;
        switch (opcode & 0x00FF) {
            case 0x00E0: return this._cls();
            case 0x00EE: return this._ret();
            default: throw new Error(`undefined opcode ${hexOrder}`);
        };
    }

    _handle8 (args: { x: number, y: number, opcode: number, hexOrder: string}) {
        const { x, y, opcode, hexOrder } = args;
        switch (opcode & 0x000F) {
            case 0x0000: return this._ldVxVy({ x, y });
            case 0x0001: return this._orVxVy({ x, y });
            case 0x0002: return this._andVxVy({ x, y });
            case 0x0003: return this._xorVxVy({ x, y });
            case 0x0004: return this._addVxVy({ x, y });
            case 0x0005: return this._subVxVy({ x, y });
            case 0x0006: return this._shrVx(x);
            case 0x0007: return this._subnVxVy({ x, y });
            case 0x000E: return this._shlVx(x);
            default: throw new Error(`undefined opcode ${hexOrder}`);
        };
    }

    _handleE (args: { x: number, opcode: number, hexOrder: string}) {
        const { x, opcode, hexOrder } = args;
        switch (opcode & 0x00FF) {
            case 0x009E: return this._skpVx(x);
            case 0x00A1: return this._sknpVx(x);
            default: throw new Error(`undefined opcode ${hexOrder}`);
        };
    }

    _handleF (args: { x: number, opcode: number, hexOrder: string}) {
        const { x, opcode, hexOrder } = args;
        switch (opcode & 0x00FF) {
            case 0x0007: return this._ldVxDt(x);
            case 0x000A: return this._ldVxK(x);
            case 0x0015: return this._ldDtVx(x);
            case 0x0018: return this._ldStVx(x);
            case 0x001E: return this._addIVx(x);
            case 0x0029: return this._ldFVx(x);
            case 0x0033: return this._ldBVx(x);
            case 0x0055: return this._ldIVx(x);
            case 0x0065: return this._ldVxI(x);
            default: throw new Error(`undefined opcode ${hexOrder}`);
        };
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

    _cls () {
        this.display.clearDisplay();
    }

    _ret () {
        this.programCounter = u16(this.stack[this.stackPointer]);
        this.stackPointer--;
    }

    _jpAddr (nnn: number) {
        this.programCounter = u16(nnn);
    }

    _callAddr (nnn: number) {
        this.stackPointer++;
        this.stack[this.stackPointer] = this.programCounter;
        this.programCounter = u16(nnn);
    }

    _seVxByte (args: { x: number, kk: number }) {
        const { x, kk } = args;
        if (this.registerV[x] === kk) this.programCounter = u16(this.programCounter + 2);
    }

    _sneVxByte (args: { x: number, kk: number }) {
        const { x, kk } = args;
        if (this.registerV[x] !== kk) this.programCounter = u16(this.programCounter + 2);
    }

    _seVxVy (args: { x: number, y: number }) {
        const { x, y } = args;
        if (this.registerV[x] === this.registerV[y]) this.programCounter = u16(this.programCounter + 2);
    }

    _ldVxByte (args: { x: number, kk: number }) {
        const { x, kk } = args;
        this.registerV[x] = kk;
    }

    _addVxByte (args: { x: number, kk: number }) {
        const { x, kk } = args;
        this.registerV[x] += kk;
    }
    
    _ldVxVy (args: { x: number, y: number }) {
        const { x, y } = args;
        this.registerV[x] = this.registerV[y];
    }

    _orVxVy (args: { x: number, y: number }) {
        const { x, y } = args;
        this.registerV[x] |= this.registerV[y];
    }

    _andVxVy (args: { x: number, y: number }) {
        const { x, y } = args;
        this.registerV[x] &= this.registerV[y];
    }

    _xorVxVy (args: { x: number, y: number }) {
        const { x, y } = args;
        this.registerV[x] ^= this.registerV[y];
    }

    _addVxVy (args: { x: number, y: number }) {
        const { x, y } = args;
        this.registerV[0xF] = (this.registerV[x] + this.registerV[y] > 0xFF) ? 1 : 0;
        this.registerV[x] += this.registerV[y];
    }

    _subVxVy (args: { x: number, y: number }) {
        const { x, y } = args;
        this.registerV[0xF] = (this.registerV[x] > this.registerV[y]) ? 1 : 0;
        this.registerV[x] -= this.registerV[y];
    }

    _shrVx (x: number) {
        this.registerV[0xF] = (this.registerV[x] & 0x1) ? 1 : 0;
        this.registerV[x] >>= 1;
    }

    _subnVxVy (args: { x: number, y: number }) {
        const { x, y } = args;
        this.registerV[0xF] = (this.registerV[y] > this.registerV[x]) ? 1 : 0;
        this.registerV[x] = this.registerV[y] - this.registerV[x];
    }

    _shlVx (x: number) {
        this.registerV[0xF] = (this.registerV[x] & 0x80) ? 1 : 0;
        this.registerV[x] <<= 1;
    }

    _sneVxVy (args: { x: number, y: number }) {
        const { x, y } = args;
        if (this.registerV[x] !== this.registerV[y]) this.programCounter = u16(this.programCounter + 2);
    }

    _ldIAddr (nnn: number) {
        this.indexRegisterI = u16(nnn);
    }

    _jpV0Addr (nnn: number) {
        this.programCounter = u16(nnn + this.registerV[0]);
    }

    _rndVxByte (args: { x: number, kk: number }) {
        const { x, kk } = args;
        this.registerV[x] = Math.floor(Math.random() * 0xFF) & kk;
    }

    // dもnも一緒に扱ってOK
    _drwVxVyNibble (args: { x: number, y: number , n: number}) {
        const { x, y, n } = args;
        this.registerV[0xf] = 0;

        for (let byteOffset = 0; byteOffset < n; byteOffset++) {
            const byte = this.memory[this.indexRegisterI + byteOffset];
            for (let bitOffset = 0; bitOffset < 8; bitOffset++) {
                if ((byte & (0x80 >> bitOffset)) === 0) continue;

                const currX = (this.registerV[x] + bitOffset) % DISPLAY_WIDTH;
                const currY = (this.registerV[y] + byteOffset) % DISPLAY_HEIGHT;

                const pixel = this.display.getDisplayPixel({ currY, currX });
                const xor = (pixel ^ 1) as 0|1;
                this.display.setDisplayPixel({ currY, currX, value: xor });

                // 既存のビットが立っていたら衝突
                if (pixel === 1) this.registerV[0xf] = 1;

                this.display.renderDisplay();
            }
        }
    }

    _skpVx (x: number) {
        if (this.display.keyInput === this.registerV[x]) this.programCounter = u16(this.programCounter + 2);
    }

    _sknpVx (x: number) {
        if (this.display.keyInput !== this.registerV[x]) this.programCounter = u16(this.programCounter + 2);
    }

    _ldVxDt (x: number) {
        this.registerV[x] = this.delayTimer;
    }

    _ldVxK (x: number) {
        // キーが押下されている
        if (this.display.keyInput !== null) {
            this.registerV[x] = this.display.keyInput;
        }
        // されていない（プログラムカウンタを進めずに待つ）
        else {
            this.programCounter = u16(this.programCounter - 2);
        }
    }

    _ldDtVx (x: number) {
        this.delayTimer = u8(this.registerV[x]);
    }

    _ldStVx (x: number) {
        this.soundTimer = u8(this.registerV[x]);
    }

    _addIVx (x: number) {
        this.indexRegisterI = u16(this.indexRegisterI + this.registerV[x]);
    }

    _ldFVx (x: number) {
        this.indexRegisterI = u16(this.registerV[x] * 0x5);
    }

    _ldBVx (x: number) {
        let v = this.registerV[x];
        const B = Math.floor(v / 100);

        v = v - B * 100;
        const C = Math.floor(v / 10);

        v = v - C * 10;
        const D = Math.floor(v);

        this.memory[this.indexRegisterI]     = B;
        this.memory[this.indexRegisterI + 1] = C;
        this.memory[this.indexRegisterI + 2] = D;
    }

    _ldIVx (x: number) {
        for (let i = 0; i <= x; i++) {
            this.memory[this.indexRegisterI + i] = this.registerV[i];
        }
    }

    _ldVxI (x: number) {
        for (let i = 0; i <= x; i++) {
            this.registerV[i] = this.memory[this.indexRegisterI + i];
        }
    }

    #debugDump (hexOrder: string) {
        if (!this.#debug) return;
        if (!this.#logger) return;

        const dump = {
            'Order'  : hexOrder,
            'V'      : this.registerV,
            'I'      : this.indexRegisterI,
            'PG'     : this.programCounter,
            'Stack'  : this.stack,
            'SP'     : this.stackPointer,
            'DT'     : this.delayTimer,
            'ST'     : this.soundTimer,
            'Display': this.display.getDisplay(),
        };
        this.#logger.trace(dump);
    }
}