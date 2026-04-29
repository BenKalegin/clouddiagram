import React, {ReactNode, useEffect, useRef} from "react";
import {Box, CssBaseline, Divider, Stack, styled, ThemeProvider} from "@mui/material";
import {Provider as JotaiProvider, createStore, useStore} from "jotai";
import {AppLayout, AppLayoutContext, defaultAppLayout} from "./editorLayout";
import {PropertiesDrawer} from "./PropertiesDrawer";
import {getTheme} from "../common/colors/colorSchemas";
import {KeyboardShortcuts} from "../features/diagramEditor/KeyboardShortcuts";
import {Toolbox} from "../features/toolbox/Toolbox";
import {DiagramTabs} from "../features/diagramTabs/DiagramTabs";
import {RecoveryService} from "../services/recovery/recoveryService";
import {CloudDiagramDocument} from "../features/export/CloudDiagramFormat";
import {
    getCloudDiagramDocumentFromStore,
    hydrateCloudDiagramDocument,
    subscribeToDocumentChanges
} from "./documentAdapter";
import {PersistenceMode, PersistenceService} from "../services/persistence/persistenceService";
import {useTransaction} from "../common/state/jotaiShim";

const DEFAULT_CHANGE_DEBOUNCE_MS = 300;
const INITIAL_HYDRATION_KEY = "initial";

interface MainProps {
    open?: boolean;
    drawerwidth: number;
}

const Main = styled("main", {
    shouldForwardProp: (prop) => prop !== "open" && prop !== "drawerwidth"
})<MainProps>(({theme, open, drawerwidth}) => ({
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

export interface CloudDiagramCanvasProps {
    /**
     * Optional content rendered above the editing area, inside the canvas's
     * jotai/theme/layout providers. Use this slot to inject toolbar items that
     * need access to canvas state (e.g. UndoRedoControls).
     */
    header?: ReactNode;
    height?: React.CSSProperties["height"];
    initialLayout?: AppLayout;
    value?: CloudDiagramDocument;
    valueVersion?: string | number;
    persistenceMode?: PersistenceMode;
    recoverOnMount?: boolean;
    showPropertiesPane?: boolean;
    onChange?: (document: CloudDiagramDocument) => void;
    onDocumentLoad?: (document: CloudDiagramDocument) => void;
    onLayoutChange?: (layout: AppLayout) => void;
}

/** Embeddable diagram editing surface. No app chrome — hosts compose their own. */
export function CloudDiagramCanvas({
    value,
    valueVersion,
    persistenceMode,
    ...props
}: CloudDiagramCanvasProps) {
    const resolvedPersistenceMode = persistenceMode ?? (value ? PersistenceMode.Host : PersistenceMode.Local);

    useEffect(() => {
        PersistenceService.setPersistenceMode(resolvedPersistenceMode);
    }, [resolvedPersistenceMode]);

    // One jotai store per canvas instance so multiple editors on a page don't share state.
    const storeRef = useRef<ReturnType<typeof createStore> | null>(null);
    if (storeRef.current === null) {
        storeRef.current = createStore();
    }

    return (
        <JotaiProvider store={storeRef.current}>
            <CloudDiagramCanvasContent
                {...props}
                value={value}
                valueVersion={valueVersion}
                persistenceMode={resolvedPersistenceMode}
            />
        </JotaiProvider>
    );
}

function CloudDiagramCanvasContent({
    header,
    height = "100%",
    initialLayout = defaultAppLayout,
    value,
    valueVersion,
    persistenceMode,
    recoverOnMount,
    showPropertiesPane = true,
    onChange,
    onDocumentLoad,
    onLayoutChange
}: CloudDiagramCanvasProps) {
    const [appLayout, setAppLayout] = React.useState(initialLayout);
    const recoverDiagrams = RecoveryService.useRecoverDiagrams();
    const hydrateDocument = useTransaction(({set}) => (document: CloudDiagramDocument) => {
        hydrateCloudDiagramDocument(document, set);
    }, []);
    const hydratedKeyRef = useRef<string | undefined>(undefined);
    const shouldRecoverOnMount = recoverOnMount ?? persistenceMode === PersistenceMode.Local;

    useEffect(() => {
        onLayoutChange?.(appLayout);
    }, [appLayout, onLayoutChange]);

    useEffect(() => {
        if (!shouldRecoverOnMount) return;
        recoverDiagrams().then(() => {});
    }, [recoverDiagrams, shouldRecoverOnMount]);

    useEffect(() => {
        if (!value) return;
        const hydrationKey = `${value.diagram.id}:${valueVersion ?? INITIAL_HYDRATION_KEY}`;
        if (hydratedKeyRef.current === hydrationKey) return;
        hydrateDocument(value);
        hydratedKeyRef.current = hydrationKey;
        onDocumentLoad?.(value);
    }, [hydrateDocument, onDocumentLoad, value, valueVersion]);

    const contextValue = React.useMemo(() => ({appLayout, setAppLayout}), [appLayout]);
    const drawerWidth = showPropertiesPane ? appLayout.propsDrawerWidth : 0;
    const drawerOpen = showPropertiesPane && appLayout.propsPaneOpen;
    const theme = getTheme(appLayout.darkMode);

    return (
        <AppLayoutContext.Provider value={contextValue}>
            <ThemeProvider theme={theme}>
                <Box sx={{display: "flex", flexDirection: "column", height, overflow: "hidden"}}>
                    <CssBaseline/>
                    <KeyboardShortcuts/>
                    {onChange && <CloudDiagramDocumentChangeObserver onChange={onChange}/>}
                    {header}
                    <Box sx={{display: "flex", flex: 1, minHeight: 0, overflow: "hidden"}}>
                        <Main
                            open={drawerOpen}
                            drawerwidth={drawerWidth}
                            sx={{
                                height: "100%",
                                display: "flex",
                                flexDirection: "column",
                                p: 0,
                                overflow: "hidden"
                            }}
                        >
                            <Stack direction="row" sx={{flex: 1, overflow: "hidden", minWidth: 0, minHeight: 0}}>
                                <Toolbox/>
                                <Divider orientation="vertical" flexItem/>
                                <DiagramTabs/>
                            </Stack>
                        </Main>
                        {showPropertiesPane && <PropertiesDrawer/>}
                    </Box>
                </Box>
            </ThemeProvider>
        </AppLayoutContext.Provider>
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
    const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const lastSerializedRef = useRef<string | undefined>(undefined);
    const onChangeRef = useRef(onChange);

    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    useEffect(() => {
        const fire = () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => {
                try {
                    const document = getCloudDiagramDocumentFromStore(store);
                    if (!document) return;
                    // Atom subscriptions fire on every set, including no-op writes (selection
                    // toggles, transient drag state). Skip onChange when the serialized
                    // document is unchanged to avoid forcing host re-renders for nothing.
                    const serialized = JSON.stringify(document);
                    if (serialized === lastSerializedRef.current) return;
                    lastSerializedRef.current = serialized;
                    onChangeRef.current(document);
                } catch (error) {
                    console.error("Failed to read CloudDiagram document after state change", error);
                }
            }, debounceMs);
        };

        const unsubscribe = subscribeToDocumentChanges(store, fire);

        return () => {
            unsubscribe();
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [store, debounceMs]);

    return null;
}
