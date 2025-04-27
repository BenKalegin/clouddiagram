import React, { createContext } from "react";

/**
 * Interface defining the application layout
 */
export interface AppLayout {
    propsPaneOpen: boolean;
    propsDrawerWidth: number;
    darkMode: boolean;
}

/**
 * Interface defining the application layout context
 */
interface AppLayoutContextType {
    appLayout: AppLayout;
    setAppLayout: React.Dispatch<React.SetStateAction<AppLayout>>;
}

/**
 * Default application layout
 */
export const defaultAppLayout: AppLayout = {
    propsPaneOpen: false,
    propsDrawerWidth: 240,
    darkMode: false
};

/**
 * Theme service for managing application theme and layout
 */
export class ThemeService {
    /**
     * Context for managing application layout
     */
    static AppLayoutContext = createContext<AppLayoutContextType>({
        appLayout: defaultAppLayout,
        setAppLayout: () => {}
    });

    /**
     * Toggles dark mode
     * @param appLayout The current application layout
     * @returns The updated application layout with dark mode toggled
     */
    static toggleDarkMode(appLayout: AppLayout): AppLayout {
        return {
            ...appLayout,
            darkMode: !appLayout.darkMode
        };
    }

    /**
     * Toggles the properties pane
     * @param appLayout The current application layout
     * @returns The updated application layout with properties pane toggled
     */
    static togglePropertiesPane(appLayout: AppLayout): AppLayout {
        return {
            ...appLayout,
            propsPaneOpen: !appLayout.propsPaneOpen
        };
    }

    /**
     * Sets the properties drawer width
     * @param appLayout The current application layout
     * @param width The new width
     * @returns The updated application layout with the new properties drawer width
     */
    static setPropertiesDrawerWidth(appLayout: AppLayout, width: number): AppLayout {
        return {
            ...appLayout,
            propsDrawerWidth: width
        };
    }
}