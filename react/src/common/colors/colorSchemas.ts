// Create theme based on darkMode flag
import {createTheme} from "@mui/material";
import {ColorSchema} from "../../package/packageModel";

const darkTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#90caf9',
        },
        secondary: {
            main: '#f48fb1',
        },
        background: {
            default: '#1e1f22',
        },
    },
});

const lightTheme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: '#1976d2',
        },
        secondary: {
            main: '#e91e63',
        },
    },
});

export const defaultColorSchema: ColorSchema = {
    strokeColor: "#deb887",
    fillColor: "#FFF8DC",
    textColor: "#000000"
}

const pinkColorSchema: ColorSchema = {
    strokeColor: "#F08080",
    fillColor: "#FFE4E1",
    textColor: "#000000"
}

const leafColorSchema: ColorSchema = {
    strokeColor: "#9EBD5D",
    fillColor: "#F4F7EC",
    textColor: "#000000"
}

const steelColorSchema: ColorSchema = {
    strokeColor: "#AEBFD1",
    fillColor: "#F0F5FF",
    textColor: "#000000"
}

const darkForest1Colors: ColorSchema = {
    strokeColor: "#A57777",
    fillColor: "#EAD3D3",
    textColor: "#000000"
}

const darkForest2Colors: ColorSchema = {
    strokeColor: "#82a3b7", // 10% brighter version of #6B8EA4
    fillColor: "#bcd9ef",   // 10% brighter version of #A4C8E1
    textColor: "#000000"
}


export const colorSchemaList: ColorSchema[] = [
    defaultColorSchema,
    pinkColorSchema,
    leafColorSchema,
    steelColorSchema,
    darkForest1Colors,
    darkForest2Colors
]



export const getTheme = (darkMode: boolean) => {
    return darkMode ? darkTheme : lightTheme;
}


