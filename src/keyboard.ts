export class KeyBoard {
    #keyInput: number|null = null;
    #keyboardMapper = new Map([
        ['1', 0x1], ['2', 0x2], ['3', 0x3], ['4', 0xC],
        ['q', 0x4], ['w', 0x5], ['e', 0x6], ['r', 0xD],
        ['a', 0x7], ['s', 0x8], ['d', 0x9], ['f', 0xE],
        ['z', 0xA], ['x', 0x0], ['c', 0xB], ['v', 0xF],
    ]);

    initKey (): void {
        this.#keyInput = null;
    }

    getKey (): number|null {
        return this.#keyInput;
    }

    setKey (keyName: string): void {
        if (!this.#keyboardMapper.has(keyName)) return;
        this.#keyInput = this.#keyboardMapper.get(keyName) ?? null;
    }
}