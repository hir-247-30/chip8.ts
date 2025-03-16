import { Cpu } from '../cpu';
import { WebDisplay } from '../display/webDisplay';
import { KeyBoard } from '../keyboard';

let keyboard = new KeyBoard();
let display  = new WebDisplay(keyboard);
let cpu      = new Cpu(display, keyboard);
let halt     = false;

const sleep = (time: number) => new Promise((resolve) => setTimeout(resolve, time));

document.getElementById('roms')!.addEventListener('change', async (event): Promise<void> => {
    const target = event.currentTarget as HTMLInputElement; // EventTarget だと解釈される
    const rom = target.value;

    let romBuffer: Buffer<ArrayBufferLike>;
    try {
        const response = await fetch(rom);
        if (!response.ok) throw new Error(); // エラー時にcatchしてくれないブラウザがある

        const arrayBuffer = await response.arrayBuffer();
        romBuffer =  new Uint8Array(arrayBuffer) as Buffer<ArrayBufferLike>; // Bufferはブラウザだと使えない
    } catch {
        console.log('romが読み込めませんでした');
        return;
    }

    halt = true;

    await sleep(100); // 前のromのloopを終わらせるため一瞬止める
    
    keyboard = new KeyBoard();
    display  = new WebDisplay(keyboard);
    cpu      = new Cpu(display, keyboard);
    cpu.readRom(romBuffer);

    halt = false;
    loop();
});

document.getElementById('pause')!.addEventListener('click', () => {
    halt = !halt;
    loop();
});

function loop (): void {
    if (halt) return;

    cpu.update();
    cpu.decrementTimers();
    setTimeout(loop, 5);
}