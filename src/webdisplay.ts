import { KeyBoard } from './keyboard';
import { DISPLAY_WIDTH, DISPLAY_HEIGHT } from './common';

export class WebDisplay {
    #displayBuffer: number[][];
    #canvas: HTMLCanvasElement;
    #ctx: CanvasRenderingContext2D;

    constructor (keyboard: KeyBoard) {
        this.#displayBuffer = this.initDisplay();
        this.#canvas = document.querySelector('canvas')!;
        this.#ctx = this.#canvas.getContext("2d")!;
        this.#ctx.fillStyle = 'black';
        this.#ctx.fillRect(0, 0, DISPLAY_WIDTH * 10, DISPLAY_HEIGHT * 10);

        document.addEventListener('keydown', event => {
            keyboard.setKey(event.key);
        });

        document.addEventListener('keyup', _ => { // eslint-disable-line
            keyboard.initKey();
        });
    }

    getDisplay () {
        return this.#displayBuffer;
    }

    getDisplayPixel (args: { currY: number, currX: number }) {
        const { currY, currX } = args;
        return this.#displayBuffer[currY][currX] as 0|1;
    }

    setDisplayPixel (args: { currY: number, currX: number, value: 0|1 }) {
        const { currY, currX, value } = args;
        return this.#displayBuffer[currY][currX] = value;
    }

    initDisplay () {
        const displayBuffer: number[][] = [];
        for (let i = 0; i < DISPLAY_HEIGHT; i++) {
            displayBuffer[i] = [];
            for (let j = 0; j < DISPLAY_WIDTH; j++) {
                displayBuffer[i].push(0);
            }
        }
        return displayBuffer;
    }

    renderDisplay () {
        for (let y = 0; y < DISPLAY_HEIGHT; y++) {
            for (let x = 0; x < DISPLAY_WIDTH; x++) {
                if (this.#displayBuffer[y][x]) {
                    this.#ctx.fillStyle = '#006400';
                } else {
                    this.#ctx.fillStyle = 'black';
                }
                this.#ctx.fillRect(x * 10, y * 10, 10, 10);
            }
        }
    }

    clearDisplay () {
        this.#displayBuffer = this.initDisplay();
        this.renderDisplay();
    }
}