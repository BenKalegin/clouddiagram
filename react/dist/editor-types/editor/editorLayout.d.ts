import React from "react";
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
export declare const defaultAppLayout: AppLayout;
export declare const AppLayoutContext: React.Context<AppLayoutContextType>;
export declare function toggleDarkMode(appLayout: AppLayout): AppLayout;
export declare function togglePropertiesPane(appLayout: AppLayout): AppLayout;
export declare function setPropertiesDrawerWidth(appLayout: AppLayout, width: number): AppLayout;
export declare function toggleShowGrid(appLayout: AppLayout): AppLayout;
//# sourceMappingURL=editorLayout.d.ts.map