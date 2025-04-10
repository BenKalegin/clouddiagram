import {ColorSchema} from "../../package/packageModel";

/**
 * A utility to store RGB components (0-255).
 */
interface RGB {
    r: number;
    g: number;
    b: number;
}

/**
 * A utility to store HSL components:
 *   h: [0..360)
 *   s: [0..1]
 *   l: [0..1]
 */
interface HSL {
    h: number;
    s: number;
    l: number;
}

/**
 * Converts a hex color (#RRGGBB or #RGB) to an RGB object.
 */
function hexToRGB(hex: string): RGB {
    // Remove leading # if present
    hex = hex.replace(/^#/, '');

    // Handle short form (#RGB)
    if (hex.length === 3) {
        const [r, g, b] = hex.split('');
        hex = r + r + g + g + b + b;
    }

    const num = parseInt(hex, 16);
    return {
        r: (num >> 16) & 255,
        g: (num >> 8) & 255,
        b: num & 255,
    };
}

/**
 * Converts an RGB color to a hex string (#RRGGBB).
 */
function rgbToHex(rgb: RGB): string {
    const toHex = (val: number) => {
        const h = val.toString(16);
        return h.length === 1 ? '0' + h : h;
    };
    return '#' + toHex(rgb.r) + toHex(rgb.g) + toHex(rgb.b);
}

/**
 * Converts an RGB object to HSL.
 * h ∈ [0..360), s ∈ [0..1], l ∈ [0..1]
 */
function rgbToHsl({ r, g, b }: RGB): HSL {
    const R = r / 255;
    const G = g / 255;
    const B = b / 255;

    const max = Math.max(R, G, B);
    const min = Math.min(R, G, B);
    let h = 0, s = 0;
    const l = (max + min) / 2;

    const delta = max - min;
    if (delta !== 0) {
        s = l < 0.5 ? delta / (max + min) : delta / (2 - max - min);

        if (max === R) {
            h = (G - B) / delta + (G < B ? 6 : 0);
        } else if (max === G) {
            h = (B - R) / delta + 2;
        } else {
            h = (R - G) / delta + 4;
        }
        h *= 60; // convert to degrees
    }

    return { h, s, l };
}

/**
 * Converts HSL to an RGB object.
 */
function hslToRgb({ h, s, l }: HSL): RGB {
    const C = (1 - Math.abs(2 * l - 1)) * s;
    const X = C * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - C / 2;

    let R = 0, G = 0, B = 0;

    if (0 <= h && h < 60) {
        R = C; G = X; B = 0;
    } else if (60 <= h && h < 120) {
        R = X; G = C; B = 0;
    } else if (120 <= h && h < 180) {
        R = 0; G = C; B = X;
    } else if (180 <= h && h < 240) {
        R = 0; G = X; B = C;
    } else if (240 <= h && h < 300) {
        R = X; G = 0; B = C;
    } else {
        R = C; G = 0; B = X;
    }

    return {
        r: Math.round((R + m) * 255),
        g: Math.round((G + m) * 255),
        b: Math.round((B + m) * 255),
    };
}

/**
 * Main function to convert a "light-theme" color into a dark-theme friendly color.
 *
 * @param color       - The original color (hex or rgb(...) or #RRGGBB).
 * @param lightenDark - How much to lighten very dark colors (0.0 = none, up to ~0.2 or 0.3).
 * @param darkenLight - How much to darken very light colors (0.0 = none, up to ~0.2 or 0.3).
 *
 * @returns The adjusted color in hex form (e.g. #RRGGBB).
 */
export function convertColorForDarkTheme(
    color: string,
    lightenDark: number = 0.1,
    darkenLight: number = 0.2
): string {
    // 1) Parse the color
    let rgb: RGB;
    if (color.startsWith('#')) {
        // Hex color
        rgb = hexToRGB(color);
    } else if (color.startsWith('rgb')) {
        // rgb(...) or rgba(...) string
        const nums = color.match(/[\d.]+/g);
        if (!nums) {
            // Fallback to black if parsing fails
            return '#000000';
        }
        const [r, g, b] = nums.map(Number);
        rgb = { r, g, b };
    } else {
        // Fallback or add more parsing if needed
        return '#000000';
    }

    // 2) Convert to HSL
    let hsl = rgbToHsl(rgb);

    // hsl.l = 1 - hsl.l; // Invert lightness for dark mode
    const pivot = 0.5; // central reference
    const compression = 0.85;
    hsl.l = hsl.l >= pivot
        ? pivot - compression * (hsl.l - pivot)
        : pivot + compression * (pivot - hsl.l);

    // If the color is too bright, darken it; if it's too dark, lighten it slightly.
/*
    if (hsl.l > 0.7) {
        // It's bright, so reduce the lightness
        hsl.l = Math.max(0, hsl.l - darkenLight);
    } else if (hsl.l < 0.3) {
        // It's quite dark, lighten it a bit
        hsl.l = Math.min(1, hsl.l + lightenDark);
    }
*/

    // 4) Convert back to RGB
    const adjustedRgb = hslToRgb(hsl);

    // 5) Return as hex (could also return `rgb(...)` string if you prefer)
    return rgbToHex(adjustedRgb);
}

function invertHexColor(hex: string): string {
    hex = hex.replace('#', '');
    if (hex.length === 3) {
        hex = hex.split('').map(char => char + char).join('');
    }
    let invertedColor = (Number(`0x1${hex}`) ^ 0xFFFFFF).toString(16).slice(1).toUpperCase();
    return `#${invertedColor}`;
}

export const adjustColorSchemaForTheme = (colorSchema: ColorSchema, darkMode: boolean): ColorSchema => {
    if (darkMode) {
        return {
            ...colorSchema,
            strokeColor: convertColorForDarkTheme(colorSchema.strokeColor),
            fillColor: convertColorForDarkTheme(colorSchema.fillColor),
            textColor: darkMode ? "#a9b7c6" : colorSchema.textColor
        }
    }
    return colorSchema;
}

