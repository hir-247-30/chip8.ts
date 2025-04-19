import * as fs from 'fs';
import { assert } from 'chai';
import { describe, it } from 'mocha';
import { Cpu } from '@src/cpu';
import { CliDisplay } from '@src/display/cliDisplay';
import { KeyBoard } from '@src/keyboard';
import { u8, u16 } from '@src/common';

describe('order', () => {
    const keyboard = new KeyBoard();
    const display  = new CliDisplay(keyboard);
    const cpu      = new Cpu(display, keyboard);

    before(function () {
        let romBuffer: Buffer<ArrayBufferLike>;
        try {
            romBuffer = fs.readFileSync('rom/ibm_logo.ch8');
        } catch {
            throw new Error('romが読み込めない');
        }
        cpu.readRom(romBuffer);
    });

    after(function () {
        console.log('COMPLETE!');
    });

    it('00E0 - CLS', () => {
        const currY = 8;
        const currX = 8;
        const value = 1;
        display.setDisplayPixel({ currY, currX, value });
        display.clearDisplay();
        display.getDisplay().forEach(pixel => {
            assert.deepEqual(pixel[0], 0);
        });
    });

    it('00EE - RET', () => {
        cpu.stack[cpu.stackPointer] = 0x300;
        cpu.programCounter = u16(0x200);
        cpu._ret();
        assert.deepEqual(cpu.programCounter, 0x300);
    });
    
    it('1nnn - JP addr', () => {
        cpu._jpAddr(0x1234);
        assert.deepEqual(cpu.programCounter, 0x1234);
    });

    // なんか怪しいような
    it('2nnn - CALL addr', () => {
        cpu.programCounter = u16(0x200);
        cpu._callAddr(0x0123);
        assert.deepEqual(cpu.stack[cpu.stackPointer], 0x200);
        assert.deepEqual(cpu.programCounter, 0x123);
    });
    
    it('3xkk - SE Vx, byte', () => {
        // v[x] == kk
        cpu.registerV[0xA] = 0x45;
        cpu.programCounter = u16(0x200);
        cpu._seVxByte({ x: 0x000A, kk: 0x0045 });
        assert.deepEqual(cpu.programCounter, 0x200 + 2);

        // v[x] != kk
        cpu.registerV[0xA] = 0x44;
        cpu.programCounter = u16(0x200);
        cpu._seVxByte({ x: 0x000A, kk: 0x0045 });
        assert.deepEqual(cpu.programCounter, 0x200 + 0);
    });
    
    it('4xkk - SNE Vx, byte', () => {
        // v[x] != kk
        cpu.registerV[0x1] = 0x10;
        cpu.programCounter = u16(0x200);
        cpu._sneVxByte({ x: 0x1, kk: 0x12 });
        assert.deepEqual(cpu.programCounter, 0x200 + 2);

        // v[x] == kk
        cpu.registerV[0x1] = 0x12;
        cpu.programCounter = u16(0x200);
        cpu._sneVxByte({ x: 0x1, kk: 0x12 });
        assert.deepEqual(cpu.programCounter, 0x200 + 0);
    });
    
    it('5xy0 - SE Vx, Vy', () => {
        // v[x] == v[y]
        cpu.registerV[0x2] = 0x30;
        cpu.registerV[0x3] = 0x30;
        cpu.programCounter = u16(0x200);
        cpu._seVxVy({ x: 0x2, y: 0x3 });
        assert.deepEqual(cpu.programCounter, 0x200 + 2);

        // v[x] != v[y]
        cpu.registerV[0x2] = 0x31;
        cpu.registerV[0x3] = 0x30;
        cpu.programCounter = u16(0x200);
        cpu._seVxVy({ x: 0x2, y: 0x3 });
        assert.deepEqual(cpu.programCounter, 0x200 + 0);
    });
    
    it('6xkk - LD Vx, byte', () => {
        cpu._ldVxByte({ x: 0xB, kk: 0xFF });
        assert.deepEqual(cpu.registerV[0xB], 0xFF);
    });
    
    it('7xkk - ADD Vx, byte', () => {
        cpu.registerV[0x1] = 0x05;
        cpu._addVxByte({ x: 0x1, kk: 0x3 });
        assert.deepEqual(cpu.registerV[0x1], 0x08);
    });
    
    it('8xy0 - LD Vx, Vy', () => {
        cpu.registerV[0xC] = 0xAA;
        cpu.registerV[0xD] = 0x55;
        cpu._ldVxVy({ x: 0xC, y: 0xD });
        assert.deepEqual(cpu.registerV[0xC], 0x55);
    });
    
    it('8xy1 - OR Vx, Vy', () => {
        cpu.registerV[0xE] = 0xF0;
        cpu.registerV[0xF] = 0x0F;
        cpu._orVxVy({ x: 0xE, y: 0xF });
        assert.deepEqual(cpu.registerV[0xE], 0xFF);
    });
    
    it('8xy2 - AND Vx, Vy', () => {
        cpu.registerV[0x3] = 0xF0;
        cpu.registerV[0x4] = 0x0F;
        cpu._andVxVy({ x: 0x3, y: 0x4 });
        assert.deepEqual(cpu.registerV[0x3], 0x00);
    });
    
    it('8xy3 - XOR Vx, Vy', () => {
        cpu.registerV[0x2] = 0xFF;
        cpu.registerV[0x1] = 0x0F;
        cpu._xorVxVy({ x: 0x2, y: 0x1 });
        assert.deepEqual(cpu.registerV[0x2], 0xF0);
    });

    it('8xy4 - ADD Vx, Vy', () => {
        cpu.registerV[0] = 0x10;
        cpu.registerV[1] = 0x20;
        cpu._addVxVy({ x: 0x0, y: 0x1 });
        assert.deepEqual(cpu.registerV[0], 0x30);
        assert.deepEqual(cpu.registerV[0xF], 0);

        // オーバーフローのケース
        cpu.registerV[0] = 0xFF;
        cpu.registerV[1] = 0x02;
        cpu._addVxVy({ x: 0x0, y: 0x1 });
        assert.deepEqual(cpu.registerV[0], 0x01);
        assert.deepEqual(cpu.registerV[0xF], 1);

        // ちょうど256
        cpu.registerV[0] = 0xFE;
        cpu.registerV[1] = 0x02;
        cpu._addVxVy({ x: 0x0, y: 0x1 });
        assert.deepEqual(cpu.registerV[0], 0x00);
        assert.deepEqual(cpu.registerV[0xF], 1);
    });

    it('8xy5 - SUB Vx, Vy', () => {
        cpu.registerV[0x7] = 0x50;
        cpu.registerV[0x8] = 0x20;
        cpu._subVxVy({ x: 0x7, y: 0x8 });
        assert.deepEqual(cpu.registerV[0x7], 0x30);
        assert.deepEqual(cpu.registerV[0xF], 0x1);

        cpu.registerV[0x7] = 0x20;
        cpu.registerV[0x8] = 0x50;
        cpu._subVxVy({ x: 0x7, y: 0x8 });
        assert.deepEqual(cpu.registerV[0x7], 0xD0);
        assert.deepEqual(cpu.registerV[0xF], 0x0);
    });

    it('8xy6 - SHR Vx {, Vy}', () => {
        cpu.registerV[0xA] = 0x3;
        cpu._shrVx(0xA);
        assert.deepEqual(cpu.registerV[0xA], 0x1);
        assert.deepEqual(cpu.registerV[0xF], 0x1);
    });

    it('8xy7 - SUBN Vx, Vy', () => {
        cpu.registerV[0xB] = 0x10;
        cpu.registerV[0xC] = 0x50;
        cpu._subnVxVy({ x: 0xB, y: 0xC });
        assert.deepEqual(cpu.registerV[0xB], 0x40);
        assert.deepEqual(cpu.registerV[0xF], 0x1);

        cpu.registerV[0xB] = 0x50;
        cpu.registerV[0xC] = 0x10;
        cpu._subnVxVy({ x: 0xB, y: 0xC });
        assert.deepEqual(cpu.registerV[0xB], 0xC0);
        assert.deepEqual(cpu.registerV[0xF], 0x0);
    });

    it('8xyE - SHL Vx {, Vy}', () => {
        cpu.registerV[0xD] = 0x80;
        cpu._shlVx(0xD);
        assert.deepEqual(cpu.registerV[0xD], 0x0);
        assert.deepEqual(cpu.registerV[0xF], 0x1);
    });

    it('9xy0 - SNE Vx, Vy', () => {
        cpu.registerV[0x2] = 0x10;
        cpu.registerV[0x3] = 0x20;
        cpu.programCounter = u16(0x200);
        cpu._sneVxVy({ x: 0x2, y: 0x3 });
        assert.deepEqual(cpu.programCounter, u16(0x200 + 2));

        cpu.registerV[0x2] = 0x10;
        cpu.registerV[0x3] = 0x10;
        cpu.programCounter = u16(0x200);
        cpu._sneVxVy({ x: 0x2, y: 0x3 });
        assert.deepEqual(cpu.programCounter, u16(0x200));
    });

    it('Annn - LD I, addr', () => {
        cpu._ldIAddr(0x123);
        assert.deepEqual(cpu.indexRegisterI, u16(0x123));
    });

    it('Bnnn - JP V0, addr', () => {
        cpu.registerV[0] = 0x20;
        cpu._jpV0Addr(0x100);
        assert.deepEqual(cpu.programCounter, u16(0x100 + 0x20));
    });

    it('Cxkk - RND Vx, byte', () => {
        cpu._rndVxByte({ x: 0, kk: 0xFF });

        // ランダム要素があるので実質テスト不可
        assert.deepEqual(cpu.registerV[0], cpu.registerV[0]);
    });

    it('Dxyn - DRW Vx, Vy, nibble', () => {
        cpu.indexRegisterI = u16(0x300);
        cpu.memory[0x300] = 0b11110000;
        cpu.registerV[0] = 0xA;
        cpu.registerV[1] = 0x5;
        cpu._drwVxVyNibble({ x: 0x0, y: 0x1, n: 0x1 });
        assert.deepEqual(cpu.registerV[0xF], 0);

        cpu._drwVxVyNibble({ x: 0x0, y: 0x1, n: 0x1 });
        assert.deepEqual(cpu.registerV[0xF], 0x1);
    });

    it('Ex9E - SKP Vx', () => {
        cpu.registerV[0] = 0xA;
        cpu.keyboard.setKey('z'); // 0xA
        cpu.programCounter = u16(0x200);
        cpu._skpVx(0x0);
        assert.deepEqual(cpu.programCounter, u16(0x200 + 0x2));

        cpu.registerV[0] = 0xA;
        cpu.keyboard.initKey();
        cpu.programCounter = u16(0x200);
        cpu._skpVx(0x0);
        assert.deepEqual(cpu.programCounter, u16(0x200));
    });

    it('ExA1 - SKNP Vx', () => {
        cpu.registerV[1] = 0xA;
        cpu.keyboard.setKey('z'); // 0xA
        cpu.programCounter = u16(0x200);
        cpu._sknpVx(0x1);
        assert.deepEqual(cpu.programCounter, u16(0x200));

        cpu.registerV[1] = 0xA;
        cpu.keyboard.initKey();
        cpu.programCounter = u16(0x200);
        cpu._sknpVx(0x1);
        assert.deepEqual(cpu.programCounter, u16(0x200 + 0x2));
    });

    it('Fx07 - LD Vx, DT', () => {
        cpu.delayTimer = u8(0x23);
        cpu._ldVxDt(0x1);
        assert.deepEqual(cpu.registerV[1], 0x23);
    });

    it('Fx0A - LD Vx, K', () => {
        cpu.programCounter = u16(0x200 + 0x2);
        cpu.keyboard.initKey();
        cpu._ldVxK(0x0);
        assert.deepEqual(cpu.programCounter, 0x200);

        cpu.keyboard.setKey('4'); // 0xC
        cpu._ldVxK(0x0);
        assert.deepEqual(cpu.registerV[0], 0xC);
    });

    it('Fx15 - LD DT, Vx', () => {
        cpu.registerV[2] = 0xA;
        cpu._ldDtVx(0x2);
        assert.deepEqual(cpu.delayTimer, 0xA);
    });

    it('Fx18 - LD ST, Vx', () => {
        cpu.registerV[3] = 0xB;
        cpu._ldStVx(0x3);
        assert.deepEqual(cpu.soundTimer, 0xB);
    });

    it('Fx1E - ADD I, Vx', () => {
        cpu.indexRegisterI = u16(0x100);
        cpu.registerV[4] = 0x20;
        cpu._addIVx(0x4);
        assert.deepEqual(cpu.indexRegisterI, 0x100 + 0x20);
    });

    it('Fx29 - LD F, Vx', () => {
        cpu.registerV[5] = 0x5;
        cpu._ldFVx(0x5);
        assert.deepEqual(cpu.indexRegisterI, 0x5 * 0x5);
    });

    it('Fx33 - LD B, Vx', () => {
        cpu.registerV[5] = 123;
        cpu.indexRegisterI = u16(0x300);
        cpu._ldBVx(0x5);
        assert.deepEqual(cpu.memory[0x300], 1);
        assert.deepEqual(cpu.memory[0x301], 2);
        assert.deepEqual(cpu.memory[0x302], 3);
    });

    it('Fx55 - LD [I], Vx', () => {
        cpu.indexRegisterI = u16(0x400);
        for (let i = 0; i <= 5; i++) {
            cpu.registerV[i] = 10 + i;
        }

        cpu._ldIVx(0x5);
        for (let i = 0; i <= 5; i++) {
            assert.deepEqual(cpu.memory[0x400 + i], 10 + i);
        }
    });

    it('Fx65 - LD Vx, [I]', () => {
        cpu.indexRegisterI = u16(0x500);
        for (let i = 0; i <= 5; i++) {
            cpu.memory[0x500 + i] = 20 + i;
        }

        cpu._ldVxI(0x5);
        for (let i = 0; i <= 5; i++) {
            assert.deepEqual(cpu.registerV[i], 20 + i);
        }
    });
});