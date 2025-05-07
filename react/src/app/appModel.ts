import React, {createContext} from "react";


export interface AppLayout {
    propsPaneOpen: boolean
    propsDrawerWidth: number
    darkMode: boolean
    showGrid: boolean
}

interface AppLayoutContextType {
    appLayout: AppLayout;
    setAppLayout: React.Dispatch<React.SetStateAction<AppLayout>>;
}
export const defaultAppLayout : AppLayout = {
    propsPaneOpen: false,
    propsDrawerWidth: 240,
    darkMode: false,
    showGrid: true
};

// browser: browserSlice.reducer,
// toolbox: toolboxSlice.reducer,
// package: packageSlice.reducer


export const AppLayoutContext = createContext<AppLayoutContextType>({
    appLayout: defaultAppLayout,
    setAppLayout: () => {}
});
