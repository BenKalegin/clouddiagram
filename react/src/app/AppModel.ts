import React, {createContext} from "react";


export interface AppLayout {
    propsPaneOpen: boolean;
    propsDrawerWidth: number;
}

interface AppLayoutContextType {
    appLayout: AppLayout;
    setAppLayout: React.Dispatch<React.SetStateAction<AppLayout>>;
}
export const defaultAppLayout = {
    propsPaneOpen: false,
    propsDrawerWidth: 240
};

// browser: browserSlice.reducer,
// toolbox: toolboxSlice.reducer,
// package: packageSlice.reducer


export const AppLayoutContext = createContext<AppLayoutContextType>({
    appLayout: defaultAppLayout,
    setAppLayout: () => {}
});
