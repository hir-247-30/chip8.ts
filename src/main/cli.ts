import * as fs from 'fs';
import { CPU } from '../cpu';
import { CliDisplay } from '../display/cliDisplay';
import { KeyBoard } from '../keyboard';

let romBuffer: Buffer<ArrayBufferLike>;
try {
    const name = process.argv[2] ?? 'ibm_logo.ch8';
    romBuffer = fs.readFileSync(`rom/${name}`);
} catch {
    throw new Error('romが読み込めない');
}

// ログファイル削除
if (fs.existsSync('logs')) fs.rmSync('logs', { recursive: true, force: true });

const keyboard = new KeyBoard();
const display = new CliDisplay(keyboard);
const cpu = new CPU(display, keyboard);
cpu.readRom(romBuffer);

function loop () {
    cpu.update();
    cpu.decrementTimers();
    setTimeout(loop, 5);
}
  
loop();