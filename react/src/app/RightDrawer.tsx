import {Drawer, IconButton, styled, useTheme} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import {PropertiesEditor} from "../features/propertiesEditor/PropertiesEditor";
import React, {useContext} from "react";
import {ThemeService} from "../services/theme/themeService";

const DrawerHeader = styled("div")(({theme}) => ({
    display: "flex",
    alignItems: "center",
    padding: theme.spacing(0, 1),
    // necessary for content to be below app bar
    ...theme.mixins.toolbar,
    justifyContent: "flex-start"
}));

export const RightDrawer = () => {
    const {appLayout, setAppLayout} = useContext(ThemeService.AppLayoutContext);
    const theme = useTheme();

    const handleDrawerClose = () => {
        setAppLayout(ThemeService.togglePropertiesPane(appLayout));
    };

    return <Drawer
        sx={{
            width: appLayout.propsDrawerWidth,
            flexShrink: 0,
            "& .MuiDrawer-paper": {
                width: appLayout.propsDrawerWidth
            }
        }}
        variant="persistent"
        anchor="right"
        open={appLayout.propsPaneOpen}
    >
        <DrawerHeader>
            <IconButton onClick={handleDrawerClose}>
                {theme.direction === "rtl" ? (
                    <ChevronLeftIcon/>
                ) : (
                    <ChevronRightIcon/>
                )}
            </IconButton>
        </DrawerHeader>
        <PropertiesEditor/>
    </Drawer>;
};
