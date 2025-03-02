import { CPU } from '../src/cpu';
import { Display } from './display';
import { KeyBoard } from './keyboard';

webRun();

async function webRun () {
    const romBuffer = await loadBuffer();

    const keyboard = new KeyBoard();
    const display = new Display(keyboard);
    const cpu = new CPU(display, keyboard);

    cpu.readRom(romBuffer);

    loop(cpu);
}

async function loadBuffer (): Promise<Buffer<ArrayBufferLike>> {
    const response = await fetch('../rom/BRIX');
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

function loop (cpu: CPU) {
    cpu.update();
    cpu.decrementTimers();
    setTimeout(loop, 5);
}