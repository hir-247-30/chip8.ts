import * as fs from 'fs'
import { CPU } from '../src/cpu'

console.log('chip8 start');

let romBuffer: Buffer<ArrayBufferLike>
try {
    romBuffer = fs.readFileSync('rom/ibm_logo.ch8');
} catch {
    throw new Error('romが読み込めない');
}

const cpu = new CPU();
cpu.readRom(romBuffer);

function loop() {
    cpu.update();
    setTimeout(loop, 5);
}
  
loop();