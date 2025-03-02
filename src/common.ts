export const DISPLAY_WIDTH  = 64;
export const DISPLAY_HEIGHT = 32;
export const FOREGROUND_COLOR = '#006400';
export const BACKGROUND_COLOR = 'black';

type Brand<K, T> = K & { __brand: T }
export type u8 = Brand<number, 'u8'>
export type u16 = Brand<number, 'u16'>

export function u8 (value: number): u8 {
    return new Uint8Array([value])[0] as u8;
}

export function u16 (value: number): u16 {
    return new Uint16Array([value])[0] as u16;
}