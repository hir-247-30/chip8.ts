import blessed from 'blessed';
import { DISPLAY_WIDTH, DISPLAY_HEIGHT } from './common';

export class Display {
    #displayBuffer: number[][];
    screen: blessed.Widgets.Screen;
    screenBox: blessed.Widgets.BoxElement;
    keyInput: number|null;

    constructor () {
        this.keyInput = null;
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
              fg: 'white',
              bg: 'black',
            }
        });

        this.screen.append(this.screenBox);
        this.screen.render();

        const keyboardMapper = new Map([
            ['1', 0x1], ['2', 0x2], ['3', 0x3], ['4', 0xC],
            ['q', 0x4], ['w', 0x5], ['e', 0x6], ['r', 0xD],
            ['a', 0x7], ['s', 0x8], ['d', 0x9], ['f', 0xE],
            ['z', 0xA], ['x', 0x0], ['c', 0xB], ['v', 0xF],
        ]);

        this.screen.on('keypress', (_, key) => {
            if (key.ctrl && key.name === 'c') process.exit();
            if (keyboardMapper.has(key.name)) {
                this.keyInput = keyboardMapper.get(key.name) ?? null;
            }
        });

        // 無理やりkeyup表現
        setInterval(() => {
            if (this.keyInput !== null) this.keyInput = null;
        }, 300);
    }

    getDisplay () {
        return this.#displayBuffer;
    }

    getDisplayPixel (params: { y: number, x: number }) {
        const { x, y } = params;
        return this.#displayBuffer[y][x] as 0|1;
    }

    setDisplayPixel (params: { y: number, x: number, value: 0|1 }) {
        const { x, y, value } = params;
        return this.#displayBuffer[y][x] = value;
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
        // バッファの内容をディスプレイで表現
        const render = this.#displayBuffer.map(row =>
            row.map(pxl => (pxl ? '█' : ' ')).join('')
        ).join('\n');
        
        this.screenBox.setContent(render);
        this.screen.render();
    }

    clearDisplay () {
        this.#displayBuffer = this.initDisplay();
        this.renderDisplay();
    }
}