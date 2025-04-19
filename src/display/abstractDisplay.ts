export abstract class Display {
    abstract getDisplay (): number[][]

    abstract getDisplayPixel (args: Readonly<{ currY: number, currX: number }>): 0|1;

    abstract setDisplayPixel (args: Readonly<{ currY: number, currX: number, value: 0|1 }>): void;

    abstract initDisplay (): void;

    abstract renderDisplay (): void;

    abstract clearDisplay (): void;
}