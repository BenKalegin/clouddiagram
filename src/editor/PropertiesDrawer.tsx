import { Drawer, IconButton } from "@benkalegin/ui26";
import { ChevronRight } from "@benkalegin/ui26/icons";
import { useContext } from "react";
import { PropertiesEditor } from "../features/propertiesEditor/PropertiesEditor";
import { AppLayoutContext, togglePropertiesPane } from "./editorLayout";
import "./PropertiesDrawer.css";

export const PropertiesDrawer = () => {
    const { appLayout, setAppLayout } = useContext(AppLayoutContext);

    const handleDrawerClose = () => {
        setAppLayout(togglePropertiesPane(appLayout));
    };

    return (
        <Drawer
            open={appLayout.propsPaneOpen}
            onClose={handleDrawerClose}
            side="right"
            size={appLayout.propsDrawerWidth}
            modal={false}
            closeOnEscape={false}
            ariaLabel="Properties"
            className="properties-drawer"
        >
            <div className="properties-drawer__header">
                <IconButton aria-label="Close properties pane" onClick={handleDrawerClose}>
                    <ChevronRight size={20} />
                </IconButton>
            </div>
            <PropertiesEditor />
        </Drawer>
    );
};
