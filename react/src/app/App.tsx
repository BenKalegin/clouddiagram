import React from 'react';
import './App.css';
import {Toolbox} from "../features/toolbox/Toolbox";
import {DiagramTabs} from "../features/diagramTabs/DiagramTabs";
import {Box, CssBaseline, Divider, Drawer, IconButton, Stack, styled, Typography, useTheme} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import {PropertiesEditor} from "../features/propertiesEditor/PropertiesEditor";

const drawerWidth = 240;
const Main = styled("main", { shouldForwardProp: (prop) => prop !== "open" })<{
    open?: boolean;
}>(({ theme, open }) => ({
    flexGrow: 1,
    padding: theme.spacing(3),
    transition: theme.transitions.create("margin", {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen
    }),
    marginRight: -drawerWidth,
    ...(open && {
        transition: theme.transitions.create("margin", {
            easing: theme.transitions.easing.easeOut,
            duration: theme.transitions.duration.enteringScreen
        }),
        marginRight: 0
    })
}));

const DrawerHeader = styled("div")(({ theme }) => ({
    display: "flex",
    alignItems: "center",
    padding: theme.spacing(0, 1),
    // necessary for content to be below app bar
    ...theme.mixins.toolbar,
    justifyContent: "flex-start"
}));

export const App = () => {
    // browser: browserSlice.reducer,
    // toolbox: toolboxSlice.reducer,
    // package: packageSlice.reducer
    const theme = useTheme();
    const [open, setOpen] = React.useState(false);

    const handleDrawerOpen = () => {
        setOpen(true);
    };

    const handleDrawerClose = () => {
        setOpen(false);
    };


    return (
        <Box sx={{display: "flex"}}>
            <CssBaseline/>
            {/* <Toolbar>
          <Typography variant="h6" noWrap sx={{ flexGrow: 1 }} component="div">
            Persistent drawer
          </Typography>
        </Toolbar> */}
            <Main open={open}>
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
            <Drawer
                sx={{
                    width: drawerWidth,
                    flexShrink: 0,
                    "& .MuiDrawer-paper": {
                        width: drawerWidth
                    }
                }}
                variant="persistent"
                anchor="right"
                open={open}
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
            </Drawer>
        </Box>
    );
};
