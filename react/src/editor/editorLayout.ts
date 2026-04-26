import React, {createContext} from "react";

export interface AppLayout {
    propsPaneOpen: boolean;
    propsDrawerWidth: number;
    darkMode: boolean;
    showGrid: boolean;
}

export interface AppLayoutContextType {
    appLayout: AppLayout;
    setAppLayout: React.Dispatch<React.SetStateAction<AppLayout>>;
}

export const defaultAppLayout: AppLayout = {
    propsPaneOpen: false,
    propsDrawerWidth: 240,
    darkMode: false,
    showGrid: true
};

export const AppLayoutContext = createContext<AppLayoutContextType>({
    appLayout: defaultAppLayout,
    setAppLayout: () => {}
});

export function toggleDarkMode(appLayout: AppLayout): AppLayout {
    return {
        ...appLayout,
        darkMode: !appLayout.darkMode
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
