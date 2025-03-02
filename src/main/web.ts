import { CPU } from '../cpu';
import { WebDisplay } from '../display/webDisplay';
import { KeyBoard } from '../keyboard';

const romBuffer = await loadBuffer();

const keyboard = new KeyBoard();
const display = new WebDisplay(keyboard);
const cpu = new CPU(display, keyboard);

cpu.readRom(romBuffer);

async function loadBuffer (): Promise<Buffer<ArrayBufferLike>> {
    const response = await fetch('BRIX');
    const arrayBuffer = await response.arrayBuffer();
    // Bufferはブラウザだと使えない
    return new Uint8Array(arrayBuffer) as Buffer<ArrayBufferLike>;
}

function loop () {
    cpu.update();
    cpu.decrementTimers();
    setTimeout(loop, 5);
}

loop();