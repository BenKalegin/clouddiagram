import {createTheme} from "@mui/material";
import {atom} from "jotai";
import {findTheme, ThemeId, type ThemeColors} from "@benkalegin/ui26";
import {ColorSchema} from "../../package/packageModel";

const FALLBACK_DARK: ThemeColors = {
    bgBase: "#1e1f22",
    bgSurface: "#181818",
    bgOverlay: "#2a2a2a",
    bgMuted: "#3a3a3a",
    textPrimary: "#e0e0e0",
    textSecondary: "#a0a0a0",
    textMuted: "#6a6a6a",
    accent: "#90caf9",
    accentHover: "#64b5f6",
    green: "#a6d784",
    red: "#f48fb1",
    yellow: "#ffd866",
    border: "#3a3a3a",
    scrollbarBg: "#181818",
    scrollbarThumb: "#3a3a3a",
    diffAddedBg: "#1e2d22",
    diffRemovedBg: "#2d1e22"
};

function ui26Colors(darkMode: boolean): ThemeColors {
    const id = darkMode ? ThemeId.Graphite : ThemeId.GithubLight;
    return findTheme(id)?.colors ?? FALLBACK_DARK;
}

export const defaultColorSchema: ColorSchema = {
    strokeColor: "#deb887",
    fillColor: "#FFF8DC",
    textColor: "#000000"
};

const pinkColorSchema: ColorSchema = {
    strokeColor: "#F08080",
    fillColor: "#FFE4E1",
    textColor: "#000000"
};

const leafColorSchema: ColorSchema = {
    strokeColor: "#9EBD5D",
    fillColor: "#F4F7EC",
    textColor: "#000000"
};

const steelColorSchema: ColorSchema = {
    strokeColor: "#AEBFD1",
    fillColor: "#F0F5FF",
    textColor: "#000000"
};

const darkForest1Colors: ColorSchema = {
    strokeColor: "#A57777",
    fillColor: "#EAD3D3",
    textColor: "#000000"
};

const darkForest2Colors: ColorSchema = {
    strokeColor: "#82a3b7",
    fillColor: "#bcd9ef",
    textColor: "#000000"
};


export const colorSchemaList: ColorSchema[] = [
    defaultColorSchema,
    pinkColorSchema,
    leafColorSchema,
    steelColorSchema,
    darkForest1Colors,
    darkForest2Colors
];


export const getTheme = (darkMode: boolean, backgrounds?: { default?: string; paper?: string }) => {
    const c = ui26Colors(darkMode);
    return createTheme({
        palette: {
            mode: darkMode ? "dark" : "light",
            primary: { main: c.accent },
            secondary: { main: c.red },
            background: {
                default: backgrounds?.default ?? c.bgBase,
                paper: backgrounds?.paper ?? c.bgSurface
            },
            text: {
                primary: c.textPrimary,
                secondary: c.textSecondary
            },
            divider: c.border
        }
    });
};

// Per-store atom so each CloudDiagramCanvas instance can have its own default.
export const defaultColorSchemaAtom = atom<ColorSchema>(defaultColorSchema);
