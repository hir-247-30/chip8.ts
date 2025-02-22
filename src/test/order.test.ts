import * as fs from 'fs'
import { CPU } from '../cpu'
import { Display } from '../display'
import { assert } from 'chai';
import { describe, it } from 'mocha';
import { DISPLAY_WIDTH, DISPLAY_HEIGHT } from '../define';

describe('order', () => {
    const cpu = new CPU();
    const display = new Display();

    before(function() {
        let romBuffer: Buffer<ArrayBufferLike>
        try {
            romBuffer = fs.readFileSync('rom/ibm_logo.ch8');
        } catch {
            throw new Error('romが読み込めない');
        }
        cpu.readRom(romBuffer);
    });

    after(function() {
        console.log('COMPLETE!')
    });

    it('00E0 - CLS', () => {
        display.displayBuffer = new Array(DISPLAY_WIDTH * DISPLAY_HEIGHT).fill(1);
        display.clearDisplay();
        display.displayBuffer.forEach(pixel => {
            assert.deepEqual(pixel[0], 0);
        });
    });

    it('00EE - RET', () => {
        cpu.stack[cpu.stackPointer] = 0x300;
        cpu.programCounter = 0x200;
        cpu._ret();
        assert.deepEqual(cpu.programCounter, 0x300);
    });
    
    it('1nnn - JP addr', () => {
        cpu._jpAddr(0x1234);
        assert.deepEqual(cpu.programCounter, 0x1234);
    });

    // なんか怪しいような
    it('2nnn - CALL addr', () => {
        cpu.programCounter = 0x200;
        cpu._callAddr(0x0123);
        assert.deepEqual(cpu.stack[cpu.stackPointer], 0x200);
        assert.deepEqual(cpu.programCounter, 0x123);
    });
    
    it('3xkk - SE Vx, byte', () => {
        // v[x] == kk
        cpu.registerV[0xA] = 0x45;
        cpu.programCounter = 0x200;
        cpu._seVxByte(0x000A, 0x0045);
        assert.deepEqual(cpu.programCounter, 0x200 + 2);

        // v[x] != kk
        cpu.registerV[0xA] = 0x44;
        cpu.programCounter = 0x200;
        cpu._seVxByte(0x000A, 0x0045);
        assert.deepEqual(cpu.programCounter, 0x200 + 0);
    });
    
    it('4xkk - SNE Vx, byte', () => {
        // v[x] != kk
        cpu.registerV[0x1] = 0x10;
        cpu.programCounter = 0x200;
        cpu._sneVxByte(0x1, 0x12);
        assert.deepEqual(cpu.programCounter, 0x200 + 2);

        // v[x] == kk
        cpu.registerV[0x1] = 0x12;
        cpu.programCounter = 0x200;
        cpu._sneVxByte(0x1, 0x12);
        assert.deepEqual(cpu.programCounter, 0x200 + 0);
    });
    
    it('5xy0 - SE Vx, Vy', () => {
        // v[x] == v[y]
        cpu.registerV[0x2] = 0x30;
        cpu.registerV[0x3] = 0x30;
        cpu.programCounter = 0x200;
        cpu._seVxVy(0x2, 0x3);
        assert.deepEqual(cpu.programCounter, 0x200 + 2);

        // v[x] != v[y]
        cpu.registerV[0x2] = 0x31;
        cpu.registerV[0x3] = 0x30;
        cpu.programCounter = 0x200;
        cpu._seVxVy(0x2, 0x3);
        assert.deepEqual(cpu.programCounter, 0x200 + 0);
    });
    
    it('6xkk - LD Vx, byte', () => {
        cpu._ldVxByte(0xB, 0xFF);
        assert.deepEqual(cpu.registerV[0xB], 0xFF);
    });
    
    it('7xkk - ADD Vx, byte', () => {
        cpu.registerV[0x1] = 0x05;
        cpu._addVxByte(0x1, 0x3);
        assert.deepEqual(cpu.registerV[0x1], 0x08);
    });
    
    it('8xy0 - LD Vx, Vy', () => {
        cpu.registerV[0xC] = 0xAA;
        cpu.registerV[0xD] = 0x55;
        cpu._ldVxVy(0xC, 0xD);
        assert.deepEqual(cpu.registerV[0xC], 0x55);
    });
    
    it('8xy1 - OR Vx, Vy', () => {
        cpu.registerV[0xE] = 0xF0;
        cpu.registerV[0xF] = 0x0F;
        cpu._orVxVy(0xE, 0xF);
        assert.deepEqual(cpu.registerV[0xE], 0xFF);
    });
    
    it('8xy2 - AND Vx, Vy', () => {
        cpu.registerV[0x3] = 0xF0;
        cpu.registerV[0x4] = 0x0F;
        cpu._andVxVy(0x3, 0x4);
        assert.deepEqual(cpu.registerV[0x3], 0x00);
    });
    
    it('8xy3 - XOR Vx, Vy', () => {
        cpu.registerV[0x2] = 0xFF;
        cpu.registerV[0x1] = 0x0F;
        cpu._xorVxVy(0x2, 0x1);
        assert.deepEqual(cpu.registerV[0x2], 0xF0);
    });

    it('8xy4 - ADD Vx, Vy', () => {
        cpu.registerV[0] = 0x10;
        cpu.registerV[1] = 0x20;
        cpu._addVxVy(0, 1);
        assert.deepEqual(cpu.registerV[0], 0x30);
        assert.deepEqual(cpu.registerV[0xF], 0);

        // オーバーフローのケース
        cpu.registerV[0] = 0xFF;
        cpu.registerV[1] = 0x02;
        cpu._addVxVy(0, 1);
        assert.deepEqual(cpu.registerV[0], 0x01);
        assert.deepEqual(cpu.registerV[0xF], 1);

        // ちょうど256
        cpu.registerV[0] = 0xFE;
        cpu.registerV[1] = 0x02;
        cpu._addVxVy(0, 1);
        assert.deepEqual(cpu.registerV[0], 0x00);
        assert.deepEqual(cpu.registerV[0xF], 1);
    });
});