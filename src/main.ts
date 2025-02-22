import * as fs from 'fs'
import { CPU } from '../src/cpu'

console.log('chip8 start');

let romBuffer: Buffer<ArrayBufferLike>
try {
    const name = process.argv[2] ?? 'ibm_logo.ch8'
    romBuffer = fs.readFileSync(`rom/${name}`);
} catch {
    throw new Error('romが読み込めない');
}

// ログファイル削除
if (fs.existsSync('logs')) fs.rmSync('logs', { recursive: true, force: true });

const cpu = new CPU();
cpu.readRom(romBuffer);

function loop() {
    cpu.update();
    cpu.renderDisplay();
    cpu.decrementTimers();
    setTimeout(loop, 5);
}
  
loop();