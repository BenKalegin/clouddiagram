import React, {useEffect} from 'react';
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
import GridOnIcon from '@mui/icons-material/GridOn';
import GridOffIcon from '@mui/icons-material/GridOff';
import {RightDrawer} from "./RightDrawer";
import {ThemeService, defaultAppLayout} from "../services/theme/themeService";
import {getTheme} from "../common/colors/colorSchemas";
import {RecoveryService} from "../services/recovery/recoveryService";
import {UndoRedoControls} from "../features/diagramEditor/UndoRedoControls";
import {KeyboardShortcuts} from "../features/diagramEditor/KeyboardShortcuts";

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

    const recoverDiagrams = RecoveryService.useRecoverDiagrams();

    // Attempt to recover diagrams on application startup
    useEffect(() => {
        recoverDiagrams().then(recovered => {
        });
    }, [recoverDiagrams]);

    const handleDrawerOpen = () => {
        setAppLayout(ThemeService.togglePropertiesPane(appLayout));
    };

    const handleToggleTheme = () => {
        setAppLayout(ThemeService.toggleDarkMode(appLayout));
    }

    const handleToggleGrid = () => {
        setAppLayout(ThemeService.toggleShowGrid(appLayout));
    }


const theme = getTheme(appLayout.darkMode);

    return (
        <ThemeService.AppLayoutContext.Provider value={{appLayout, setAppLayout}}>
        <ThemeProvider theme={theme}>
            <Box sx={{
                display: "flex",
                height: "100vh",
                overflow: "hidden" /* Prevent scrolling at the app level */
            }}>
                <CssBaseline/>
                <KeyboardShortcuts />
                <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
                    <Toolbar sx={{ justifyContent: "space-between" }}>
                        <Typography variant="h6" noWrap component="div">
                            Cloud Diagram
                        </Typography>
                        <Stack direction="row" spacing={1}>
                            <UndoRedoControls />
                            <IconButton onClick={handleToggleTheme} color="inherit">
                                {appLayout.darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
                            </IconButton>
                            <IconButton onClick={handleToggleGrid} color="inherit">
                                {appLayout.showGrid ? <GridOnIcon /> : <GridOffIcon />}
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
        </ThemeService.AppLayoutContext.Provider>
    );
};
