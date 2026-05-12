import React, {createContext} from "react";
import {DEFAULT_THEME_ID, findTheme, ThemeGroup, ThemeId} from "@benkalegin/ui26";

export interface AppLayout {
    propsPaneOpen: boolean;
    propsDrawerWidth: number;
    themeId: ThemeId;
    /** Derived from themeId — kept in sync via setThemeId(). Read-only signal for diagram renderers. */
    darkMode: boolean;
    showGrid: boolean;
    canvasBackground?: string;
}

export interface AppLayoutContextType {
    appLayout: AppLayout;
    setAppLayout: React.Dispatch<React.SetStateAction<AppLayout>>;
}

export function isDarkThemeId(themeId: ThemeId): boolean {
    return findTheme(themeId)?.group === ThemeGroup.Dark;
}

export const defaultAppLayout: AppLayout = {
    propsPaneOpen: false,
    propsDrawerWidth: 240,
    themeId: DEFAULT_THEME_ID,
    darkMode: isDarkThemeId(DEFAULT_THEME_ID),
    showGrid: true
};

export const AppLayoutContext = createContext<AppLayoutContextType>({
    appLayout: defaultAppLayout,
    setAppLayout: () => {}
});

export function setThemeId(appLayout: AppLayout, themeId: ThemeId): AppLayout {
    return {
        ...appLayout,
        themeId,
        darkMode: isDarkThemeId(themeId)
    };
}

export function togglePropertiesPane(appLayout: AppLayout): AppLayout {
    return {
        ...appLayout,
        propsPaneOpen: !appLayout.propsPaneOpen
    };
}

export function setPropertiesDrawerWidth(appLayout: AppLayout, width: number): AppLayout {
    return {
        ...appLayout,
        propsDrawerWidth: width
    };
}

export function toggleShowGrid(appLayout: AppLayout): AppLayout {
    return {
        ...appLayout,
        showGrid: !appLayout.showGrid
    };
}
