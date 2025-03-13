import blessed from 'blessed';
import { Display } from './abstractDisplay';
import { KeyBoard } from '../keyboard';
import { DISPLAY_WIDTH, DISPLAY_HEIGHT, FOREGROUND_COLOR, BACKGROUND_COLOR } from '../common';

export class CliDisplay extends Display {
    #displayBuffer: number[][];
    screen        : blessed.Widgets.Screen;
    screenBox     : blessed.Widgets.BoxElement;

    constructor (keyboard: KeyBoard) {
        super();

        this.#displayBuffer = this.initDisplay();
        this.screen = blessed.screen({
            smartCSR: true
        });
        this.screen.title = 'CHIP-8 Emulator';
        this.screenBox = blessed.box({
            top: 'center',
            left: 'center',
            wrap: false,
            // なぜ？？
            width: DISPLAY_WIDTH + 2,
            height: DISPLAY_HEIGHT + 2,
            border: {
              type: 'line',
            },
            style: {
              fg: FOREGROUND_COLOR,
              bg: BACKGROUND_COLOR,
            }
        });

        this.screen.append(this.screenBox);
        this.screen.render();

        this.screen.on('keypress', (_, key) => {
            if (key.ctrl && key.name === 'c') process.exit();
            keyboard.setKey(key.name);
        });

        // 無理やりkeyup表現
        setInterval(() => {
            if (keyboard.getKey() !== null) keyboard.initKey();
        }, 300);
    }

    getDisplay (): number[][] {
        return this.#displayBuffer;
    }

    getDisplayPixel (args: { currY: number, currX: number }): 0|1 {
        const { currY, currX } = args;
        return this.#displayBuffer[currY][currX] as 0|1;
    }

    setDisplayPixel (args: { currY: number, currX: number, value: 0|1 }): void {
        const { currY, currX, value } = args;
        this.#displayBuffer[currY][currX] = value;
    }

    initDisplay (): number[][] {
        const displayBuffer: number[][] = [];
        for (let i = 0; i < DISPLAY_HEIGHT; i++) {
            displayBuffer[i] = [];
            for (let j = 0; j < DISPLAY_WIDTH; j++) {
                displayBuffer[i].push(0);
            }
        }
        return displayBuffer;
    }

    renderDisplay (): void {
        // バッファの内容をディスプレイで表現
        const render = this.#displayBuffer.map(row =>
            row.map(pxl => (pxl ? '█' : ' ')).join('')
        ).join('\n');
        
        this.screenBox.setContent(render);
        this.screen.render();
    }

    clearDisplay (): void {
        this.#displayBuffer = this.initDisplay();
        this.renderDisplay();
    }
}