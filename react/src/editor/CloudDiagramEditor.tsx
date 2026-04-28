import React, {useEffect, useRef} from "react";
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
    Typography
} from "@mui/material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import GridOnIcon from "@mui/icons-material/GridOn";
import GridOffIcon from "@mui/icons-material/GridOff";
import SaveIcon from "@mui/icons-material/Save";
import {Provider as JotaiProvider, createStore, useStore} from "jotai";
import {
    AppLayout,
    AppLayoutContext,
    defaultAppLayout,
    toggleDarkMode,
    togglePropertiesPane,
    toggleShowGrid
} from "./editorLayout";
import {PropertiesDrawer} from "./PropertiesDrawer";
import {getTheme} from "../common/colors/colorSchemas";
import {KeyboardShortcuts} from "../features/diagramEditor/KeyboardShortcuts";
import {UndoRedoControls} from "../features/diagramEditor/UndoRedoControls";
import {Toolbox} from "../features/toolbox/Toolbox";
import {DiagramTabs} from "../features/diagramTabs/DiagramTabs";
import {RecoveryService} from "../services/recovery/recoveryService";
import {CloudDiagramDocument} from "../features/export/CloudDiagramFormat";
import {
    getCloudDiagramDocument,
    getCloudDiagramDocumentFromStore,
    hydrateCloudDiagramDocument,
    subscribeToDocumentChanges
} from "./documentAdapter";
import {PersistenceMode, PersistenceService} from "../services/persistence/persistenceService";
import {useStoreCallback, useTransaction} from "../common/state/jotaiShim";

const TOP_BAR_HEIGHT = 64;
const DEFAULT_CHANGE_DEBOUNCE_MS = 300;

interface MainProps {
    open?: boolean;
    drawerwidth: number;
    topbarheight: number;
}

const Main = styled("main", {
    shouldForwardProp: (prop) => prop !== "open" && prop !== "drawerwidth" && prop !== "topbarheight"
})<MainProps>(({theme, open, drawerwidth, topbarheight}) => ({
    flexGrow: 1,
    padding: theme.spacing(3),
    transition: theme.transitions.create("margin", {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen
    }),
    marginRight: -drawerwidth,
    marginTop: topbarheight,
    ...(open && {
        transition: theme.transitions.create("margin", {
            easing: theme.transitions.easing.easeOut,
            duration: theme.transitions.duration.enteringScreen
        }),
        marginRight: 0
    })
}));

export interface CloudDiagramEditorProps {
    title?: string;
    height?: React.CSSProperties["height"];
    initialLayout?: AppLayout;
    value?: CloudDiagramDocument;
    valueVersion?: string | number;
    persistenceMode?: PersistenceMode;
    recoverOnMount?: boolean;
    showTopBar?: boolean;
    showPropertiesPane?: boolean;
    onChange?: (document: CloudDiagramDocument) => void;
    onSave?: (document: CloudDiagramDocument) => void;
    onDocumentLoad?: (document: CloudDiagramDocument) => void;
    onLayoutChange?: (layout: AppLayout) => void;
}

export function CloudDiagramEditor({
    value,
    valueVersion,
    persistenceMode,
    ...props
}: CloudDiagramEditorProps) {
    const resolvedPersistenceMode = persistenceMode ?? (value ? PersistenceMode.Host : PersistenceMode.Local);
    PersistenceService.setPersistenceMode(resolvedPersistenceMode);

    // Each editor instance gets its own jotai store so multiple editors on a
    // single page don't share state.
    const storeRef = useRef<ReturnType<typeof createStore> | null>(null);
    if (storeRef.current === null) {
        storeRef.current = createStore();
    }

    return (
        <JotaiProvider store={storeRef.current}>
            <CloudDiagramEditorContent
                {...props}
                value={value}
                valueVersion={valueVersion}
                persistenceMode={resolvedPersistenceMode}
            />
        </JotaiProvider>
    );
}

function CloudDiagramEditorContent({
    title = "Cloud Diagram",
    height = "100vh",
    initialLayout = defaultAppLayout,
    value,
    valueVersion,
    persistenceMode,
    recoverOnMount,
    showTopBar = true,
    showPropertiesPane = true,
    onChange,
    onSave,
    onDocumentLoad,
    onLayoutChange
}: CloudDiagramEditorProps) {
    const [appLayout, setAppLayout] = React.useState(initialLayout);
    const recoverDiagrams = RecoveryService.useRecoverDiagrams();
    const hydrateDocument = useTransaction(({set}) => (document: CloudDiagramDocument) => {
        hydrateCloudDiagramDocument(document, set);
    }, []);
    const getCurrentDocument = useStoreCallback(({get}) => () => getCloudDiagramDocument(get), []);
    const hydratedKeyRef = useRef<string | undefined>();
    const shouldRecoverOnMount = recoverOnMount ?? persistenceMode === PersistenceMode.Local;

    useEffect(() => {
        onLayoutChange?.(appLayout);
    }, [appLayout, onLayoutChange]);

    useEffect(() => {
        if (!shouldRecoverOnMount) {
            return;
        }

        recoverDiagrams().then(() => {});
    }, [recoverDiagrams, shouldRecoverOnMount]);

    useEffect(() => {
        if (!value) {
            return;
        }

        const hydrationKey = `${value.diagram.id}:${valueVersion ?? "initial"}`;
        if (hydratedKeyRef.current === hydrationKey) {
            return;
        }

        hydrateDocument(value);
        hydratedKeyRef.current = hydrationKey;
        onDocumentLoad?.(value);
    }, [hydrateDocument, onDocumentLoad, value, valueVersion]);

    const contextValue = React.useMemo(
        () => ({appLayout, setAppLayout}),
        [appLayout]
    );
    const drawerWidth = showPropertiesPane ? appLayout.propsDrawerWidth : 0;
    const drawerOpen = showPropertiesPane && appLayout.propsPaneOpen;
    const topBarHeight = showTopBar ? TOP_BAR_HEIGHT : 0;
    const theme = getTheme(appLayout.darkMode);

    const handleSave = React.useCallback(() => {
        const document = getCurrentDocument();
        if (document) {
            onSave?.(document);
        }
    }, [getCurrentDocument, onSave]);

    return (
        <AppLayoutContext.Provider value={contextValue}>
            <ThemeProvider theme={theme}>
                <Box sx={{
                    display: "flex",
                    height,
                    overflow: "hidden"
                }}>
                    <CssBaseline/>
                    <KeyboardShortcuts/>
                    {onChange && <CloudDiagramDocumentChangeObserver onChange={onChange}/>}
                    {showTopBar && (
                        <EditorTopBar
                            title={title}
                            appLayout={appLayout}
                            setAppLayout={setAppLayout}
                            onSave={onSave ? handleSave : undefined}
                        />
                    )}
                    <Main
                        open={drawerOpen}
                        drawerwidth={drawerWidth}
                        topbarheight={topBarHeight}
                        sx={{
                            height: showTopBar ? `calc(100% - ${TOP_BAR_HEIGHT}px)` : "100%",
                            display: "flex",
                            flexDirection: "column",
                            p: 0,
                            overflow: "hidden"
                        }}
                    >
                        <Stack direction="column" sx={{flex: 1, overflow: "hidden", minHeight: 0}}>
                            <Stack direction="row" sx={{flex: 1, overflow: "hidden", minWidth: 0}}>
                                <Toolbox/>
                                <Divider orientation="vertical" flexItem/>
                                <DiagramTabs/>
                            </Stack>
                        </Stack>
                    </Main>
                    {showPropertiesPane && <PropertiesDrawer/>}
                </Box>
            </ThemeProvider>
        </AppLayoutContext.Provider>
    );
}

interface EditorTopBarProps {
    title: string;
    appLayout: AppLayout;
    setAppLayout: React.Dispatch<React.SetStateAction<AppLayout>>;
    onSave?: () => void;
}

function EditorTopBar({title, appLayout, setAppLayout, onSave}: EditorTopBarProps) {
    const handleDrawerOpen = () => {
        setAppLayout(togglePropertiesPane(appLayout));
    };

    const handleToggleTheme = () => {
        setAppLayout(toggleDarkMode(appLayout));
    };

    const handleToggleGrid = () => {
        setAppLayout(toggleShowGrid(appLayout));
    };

    return (
        <AppBar position="fixed" sx={{zIndex: (theme) => theme.zIndex.drawer + 1}}>
            <Toolbar sx={{justifyContent: "space-between"}}>
                <Typography variant="h6" noWrap component="div">
                    {title}
                </Typography>
                <Stack direction="row" spacing={1}>
                    <UndoRedoControls/>
                    {onSave && (
                        <IconButton onClick={onSave} color="inherit">
                            <SaveIcon/>
                        </IconButton>
                    )}
                    <IconButton onClick={handleToggleTheme} color="inherit">
                        {appLayout.darkMode ? <Brightness7Icon/> : <Brightness4Icon/>}
                    </IconButton>
                    <IconButton onClick={handleToggleGrid} color="inherit">
                        {appLayout.showGrid ? <GridOnIcon/> : <GridOffIcon/>}
                    </IconButton>
                    <IconButton
                        color="inherit"
                        onClick={handleDrawerOpen}
                        edge="end"
                        sx={{borderRadius: "50%"}}
                    >
                        <ChevronRightIcon/>
                    </IconButton>
                </Stack>
            </Toolbar>
        </AppBar>
    );
}

interface CloudDiagramDocumentChangeObserverProps {
    onChange: (document: CloudDiagramDocument) => void;
    debounceMs?: number;
}

function CloudDiagramDocumentChangeObserver({
    onChange,
    debounceMs = DEFAULT_CHANGE_DEBOUNCE_MS
}: CloudDiagramDocumentChangeObserverProps) {
    const store = useStore();
    const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>();
    const onChangeRef = useRef(onChange);

    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    useEffect(() => {
        const fire = () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
            timerRef.current = setTimeout(() => {
                try {
                    const document = getCloudDiagramDocumentFromStore(store);
                    if (document) {
                        onChangeRef.current(document);
                    }
                } catch (error) {
                    console.error("Failed to read CloudDiagram document after state change", error);
                }
            }, debounceMs);
        };

        const unsubscribe = subscribeToDocumentChanges(store, fire);

        return () => {
            unsubscribe();
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, [store, debounceMs]);

    return null;
}
