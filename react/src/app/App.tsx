import React from 'react';
import './App.css';
import {Toolbox} from "../features/toolbox/Toolbox";
import {DiagramTabs} from "../features/diagramTabs/DiagramTabs";
import {
    AppBar,
    Box,
    CssBaseline,
    Divider,
    IconButton,
    Stack,
    styled,
    ThemeProvider,
    Toolbar,
    Typography,
} from "@mui/material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import {RightDrawer} from "./RightDrawer";
import {AppLayoutContext, defaultAppLayout} from "./appModel";
import {getTheme} from "../common/colors/colorSchemas";

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
    marginTop: '64px', // Add space for the AppBar
    ...(open && {
        transition: theme.transitions.create("margin", {
            easing: theme.transitions.easing.easeOut,
            duration: theme.transitions.duration.enteringScreen
        }),
        marginRight: 0
    })
}));

export const App = () => {
    const [appLayout, setAppLayout] = React.useState(defaultAppLayout);

    const handleDrawerOpen = () => {
        setAppLayout({...appLayout, propsPaneOpen: true});
    };

    const handleToggleTheme = ()=> {
        setAppLayout({...appLayout, darkMode: !appLayout.darkMode});
    }


const theme = getTheme(appLayout.darkMode);

    return (
        <AppLayoutContext.Provider value={{appLayout, setAppLayout}}>
        <ThemeProvider theme={theme}>
            <Box sx={{display: "flex"}}>
                <CssBaseline/>
                <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
                    <Toolbar sx={{ justifyContent: "space-between" }}>
                        <Typography variant="h6" noWrap component="div">
                            Cloud Diagram
                        </Typography>
                        <Stack direction="row" spacing={1}>
                            <IconButton onClick={handleToggleTheme} color="inherit">
                                {appLayout.darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
                            </IconButton>
                            <IconButton
                                color="inherit"
                                onClick={handleDrawerOpen}
                                edge="end"
                                sx={{ borderRadius: "50%" }}
                            >
                                <ChevronRightIcon/>
                            </IconButton>
                        </Stack>
                    </Toolbar>
                </AppBar>
                <Main open={appLayout.propsPaneOpen} drawerwidth={appLayout.propsDrawerWidth}>
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
        </ThemeProvider>
        </AppLayoutContext.Provider>
    );
};
