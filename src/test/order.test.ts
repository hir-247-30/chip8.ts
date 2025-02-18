import * as fs from 'fs'
import { CPU } from '../cpu'
import { assert } from 'chai';
import { describe, it } from 'mocha';

describe('order', () => {
    before(function() {
    });
    after(function() {
    });

    it('addVxVy', () => {
        let romBuffer: Buffer<ArrayBufferLike>
        try {
            romBuffer = fs.readFileSync('rom/ibm_logo.ch8');
        } catch {
            throw new Error('romが読み込めない');
        }
        
        const cpu = new CPU();
        cpu.readRom(romBuffer);

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