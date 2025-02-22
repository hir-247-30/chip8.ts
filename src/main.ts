import * as fs from 'fs'
import * as readline from 'readline'
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

// TODO blessedで実装 別ファイル
const keyboardMapper = new Map([
    ['1', 0x1], ['2', 0x2], ['3', 0x3], ['4', 0xC],
    ['q', 0x4], ['w', 0x5], ['e', 0x6], ['r', 0xD],
    ['a', 0x7], ['s', 0x8], ['d', 0x9], ['f', 0xE],
    ['z', 0xA], ['x', 0x0], ['c', 0xB], ['v', 0xF],
]);

readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);
process.stdin.on('keypress', (_, key) => {
    if (key.ctrl && key.name === 'c') process.exit();
    if (keyboardMapper.has(key.name)) {
        cpu.keyInput = keyboardMapper.get(key.name) ?? null;
    }
    // 無理やりkeyup表現
    setTimeout(() => {
        if (cpu.keyInput !== null) {
            cpu.keyInput = null;
        }
    }, 300);
});

function loop() {
    cpu.update();
    cpu.renderDisplay();
    cpu.decrementTimers();
    setTimeout(loop, 5);
}
  
loop();