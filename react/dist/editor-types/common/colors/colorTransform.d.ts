import { ColorSchema } from "../../package/packageModel";
/**
 * Main function to convert a "light-theme" color into a dark-theme friendly color.
 *
 * @param color       - The original color (hex or rgb(...) or #RRGGBB).
 * @param lightenDark - How much to lighten very dark colors (0.0 = none, up to ~0.2 or 0.3).
 * @param darkenLight - How much to darken very light colors (0.0 = none, up to ~0.2 or 0.3).
 *
 * @returns The adjusted color in hex form (e.g. #RRGGBB).
 */
export declare function convertColorForDarkTheme(color: string, lightenDark?: number, darkenLight?: number): string;
export declare const adjustColorSchemaForTheme: (colorSchema: ColorSchema, darkMode: boolean) => ColorSchema;
//# sourceMappingURL=colorTransform.d.ts.map