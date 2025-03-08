import { Cpu } from '../cpu';
import { WebDisplay } from '../display/webDisplay';
import { KeyBoard } from '../keyboard';

let keyboard = new KeyBoard();
let display  = new WebDisplay(keyboard);
let cpu      = new Cpu(display, keyboard);
let runnning = false;

const sleep = (time: number) => new Promise((resolve) => setTimeout(resolve, time));

document.getElementById('roms')!.addEventListener('change', async (event) => {
    const target = event.currentTarget as HTMLInputElement; // EventTarget だと解釈される
    const rom = target.value;

    let romBuffer: Buffer<ArrayBufferLike>;
    try {
        const response = await fetch(rom);
        // エラー時にcatchしてくれないブラウザがある
        if (!response.ok) {
            throw new Error();
        }

        const arrayBuffer = await response.arrayBuffer();
        // Bufferはブラウザだと使えない
        romBuffer =  new Uint8Array(arrayBuffer) as Buffer<ArrayBufferLike>;
    } catch {
        console.log('romが読み込めませんでした');
        return false;
    }

    runnning = false;

    // 前のromのloopを終わらせるため一瞬止める
    await sleep(100);
    
    keyboard = new KeyBoard();
    display  = new WebDisplay(keyboard);
    cpu      = new Cpu(display, keyboard);
    cpu.readRom(romBuffer);

    runnning = true;
    loop();
});

document.getElementById('pause')!.addEventListener('click', () => {
    runnning = !runnning;
    loop();
});

function loop () {
    if (!runnning) return;

    cpu.update();
    cpu.decrementTimers();
    setTimeout(loop, 5);
}