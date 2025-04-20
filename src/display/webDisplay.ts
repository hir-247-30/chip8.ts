import { Display } from '@src/display/abstractDisplay';
import { KeyBoard } from '@src/keyboard';
import { DISPLAY_WIDTH, DISPLAY_HEIGHT, FOREGROUND_COLOR, BACKGROUND_COLOR, assertUndefined } from '@src/common';

export class WebDisplay extends Display {
    #displayBuffer: number[][];
    #canvas       : HTMLCanvasElement;
    #ctx          : CanvasRenderingContext2D;
    #zoom         : Readonly<number> = 10;

    constructor (keyboard: KeyBoard) {
        super();

        this.#displayBuffer = this.initDisplay();
        this.#canvas = document.querySelector('canvas')!;
        this.#ctx = this.#canvas.getContext("2d")!;
        this.#ctx.fillStyle = BACKGROUND_COLOR;
        this.#ctx.fillRect(0, 0, DISPLAY_WIDTH * this.#zoom, DISPLAY_HEIGHT * this.#zoom);

        document.addEventListener('keydown', event => {
            keyboard.setKey(event.key);
        });

        document.addEventListener('keyup', _ => { // eslint-disable-line
            keyboard.initKey();
        });
    }

    getDisplay (): number[][] {
        return this.#displayBuffer;
    }

    getDisplayPixel (args: Readonly<{ currY: number, currX: number }>): 0|1 {
        const { currY, currX } = args;

        assertUndefined(this.#displayBuffer[currY]?.[currX]);

        return this.#displayBuffer[currY]?.[currX] as 0|1;
    }

    setDisplayPixel (args: Readonly<{ currY: number, currX: number, value: 0|1 }>): void {
        const { currY, currX, value } = args;

        assertUndefined(this.#displayBuffer[currY]?.[currX]);

        this.#displayBuffer[currY][currX] = value;
    }

    initDisplay (): number[][] {
        const displayBuffer: number[][] = [];
        for (let i = 0; i < DISPLAY_HEIGHT; i++) {
            displayBuffer[i] = [];
            for (let j = 0; j < DISPLAY_WIDTH; j++) {
                displayBuffer[i]!.push(0);
            }
        }
        return displayBuffer;
    }

    renderDisplay (): void {
        for (let y = 0; y < DISPLAY_HEIGHT; y++) {
            for (let x = 0; x < DISPLAY_WIDTH; x++) {
                if (this.#displayBuffer[y]?.[x]) {
                    this.#ctx.fillStyle = FOREGROUND_COLOR;
                } else {
                    this.#ctx.fillStyle = BACKGROUND_COLOR;
                }
                this.#ctx.fillRect(x * this.#zoom, y * this.#zoom, this.#zoom, this.#zoom);
            }
        }
    }

    clearDisplay (): void {
        this.#displayBuffer = this.initDisplay();
        this.renderDisplay();
    }
}