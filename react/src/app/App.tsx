import React from 'react';
import './App.css';
import {Toolbox} from "../features/toolbox/Toolbox";
import {DiagramTabs} from "../features/diagramTabs/DiagramTabs";
import {Box, CssBaseline, Divider, IconButton, Stack, styled, Typography, useTheme} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import {RightDrawer} from "./RightDrawer";
import {AppLayout, AppLayoutContext, defaultAppLayout} from "./AppModel";


const Main = styled("main", {shouldForwardProp: (prop) => prop !== "open"})<
    {
        open?: boolean,
        drawerwidth: number
    }>(({theme, open, drawerwidth}) => ({
    flexGrow: 1,
    padding: theme.spacing(3),
    transition: theme.transitions.create("margin", {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen
    }),
    marginRight: -drawerwidth,
    ...(open && {
        transition: theme.transitions.create("margin", {
            easing: theme.transitions.easing.easeOut,
            duration: theme.transitions.duration.enteringScreen
        }),
        marginRight: 0
    })
}));

export const App = () => {
    const theme = useTheme();
    const [appLayout, setAppLayout] = React.useState(defaultAppLayout);


    const handleDrawerOpen = () => {
        const newLayout: AppLayout = {...appLayout, propsPaneOpen: true};
        setAppLayout(newLayout);
    };

    return (
        <AppLayoutContext.Provider value={{appLayout, setAppLayout}}>
            <Box sx={{display: "flex"}}>
                <CssBaseline/>
                <Main open={appLayout.propsPaneOpen} drawerwidth={appLayout.propsDrawerWidth}>
                    <Stack direction="row">
                        <Typography>Cloud Diagram</Typography>
                        <IconButton
                            onClick={handleDrawerOpen}
                            sx={{
                                position: "absolute",
                                top: 5,
                                right: 5,
                                borderRadius: "50%"
                            }}

                        >
                            {theme.direction === "rtl" ? (
                                <ChevronLeftIcon/>
                            ) : (
                                <ChevronRightIcon/>
                            )}
                        </IconButton>
                    </Stack>
                    {/*<DrawerHeader />*/}
                    <Stack direction="column">
                        <Stack direction="row">
                            <Toolbox/>
                            <Divider/>
                            <DiagramTabs/>
                        </Stack>
                    </Stack>
                </Main>
                <RightDrawer/>
            </Box>
        </AppLayoutContext.Provider>
    );
};
