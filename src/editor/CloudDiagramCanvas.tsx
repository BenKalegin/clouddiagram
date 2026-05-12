import React, {ReactNode, useEffect, useRef} from "react";
import {applyTheme, ThemeId} from "@benkalegin/ui26";
import {Provider as JotaiProvider, createStore, useStore} from "jotai";
import {AppLayout, AppLayoutContext, defaultAppLayout, isDarkThemeId} from "./editorLayout";
import {PropertiesDrawer} from "./PropertiesDrawer";
import {defaultColorSchema, defaultColorSchemaAtom} from "../common/colors/colorSchemas";
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
import {STORAGE_KEY} from "../common/persistence/statePersistence";
import {useTransaction} from "../common/state/jotaiShim";
import {ColorSchema} from "../package/packageModel";
import "./CloudDiagramCanvas.css";

export interface DiagramTheme {
    /** Host-supplied skin. When set, takes precedence over user-stored preference. */
    themeId?: ThemeId;
    /** @deprecated Pass `themeId` instead. When set without themeId, maps to Graphite (dark) / GithubLight (light). */
    darkMode?: boolean;
    /** Background colour of the canvas area (Konva stage wrapper). */
    canvasBackground?: string;
    /** Background colour of side panels (toolbox, properties pane). */
    panelBackground?: string;
    /** Colour schema applied to newly created and imported nodes/links. */
    defaultColorSchema?: ColorSchema;
}

function resolveThemeIdFromHost(theme: DiagramTheme | undefined): ThemeId | undefined {
    if (theme?.themeId !== undefined) return theme.themeId;
    if (theme?.darkMode !== undefined) return theme.darkMode ? ThemeId.Graphite : ThemeId.GithubLight;
    return undefined;
}

const DEFAULT_CHANGE_DEBOUNCE_MS = 300;
const INITIAL_HYDRATION_KEY = "initial";
const APP_LAYOUT_STORAGE_KEY = `${STORAGE_KEY}_appLayout`;

export interface CloudDiagramCanvasProps {
    /**
     * Optional content rendered above the editing area, inside the canvas's
     * jotai/theme/layout providers. Use this slot to inject toolbar items that
     * need access to canvas state (e.g. UndoRedoControls).
     */
    header?: ReactNode;
    height?: React.CSSProperties["height"];
    initialLayout?: AppLayout;
    /** Host-supplied visual theme. Values here override user-toggled layout settings. */
    theme?: DiagramTheme;
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
    theme,
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
        // Seed the atom synchronously so the very first render uses the right colour.
        if (theme?.defaultColorSchema) {
            storeRef.current.set(defaultColorSchemaAtom, {...theme.defaultColorSchema, rawColors: true});
        }
    }

    return (
        <JotaiProvider store={storeRef.current}>
            <CloudDiagramCanvasContent
                {...props}
                theme={theme}
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
    theme,
    value,
    valueVersion,
    persistenceMode,
    recoverOnMount,
    showPropertiesPane = true,
    onChange,
    onDocumentLoad,
    onLayoutChange
}: CloudDiagramCanvasProps) {
    const [appLayout, setAppLayout] = React.useState<AppLayout>(() => {
        const hostThemeId = resolveThemeIdFromHost(theme);
        const themeOverride: Partial<AppLayout> = hostThemeId !== undefined
            ? {themeId: hostThemeId, darkMode: isDarkThemeId(hostThemeId)}
            : {};
        const base: AppLayout = {
            ...initialLayout,
            ...themeOverride,
            ...(theme?.canvasBackground !== undefined && {canvasBackground: theme.canvasBackground}),
        };
        if (persistenceMode === PersistenceMode.Host) return base;
        try {
            const stored = localStorage.getItem(APP_LAYOUT_STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored) as Partial<AppLayout>;
                const restored: AppLayout = {...base, ...parsed};
                if (parsed.themeId !== undefined) {
                    restored.darkMode = isDarkThemeId(parsed.themeId);
                }
                return {
                    ...restored,
                    // Re-apply host overrides so they always win over stored values
                    ...themeOverride,
                    ...(theme?.canvasBackground !== undefined && {canvasBackground: theme.canvasBackground}),
                };
            }
        } catch {}
        return base;
    });
    const store = useStore();
    const recoverDiagrams = RecoveryService.useRecoverDiagrams();
    const themeDefaultColorSchema = theme?.defaultColorSchema;
    const hydrateDocument = useTransaction(({set}) => (document: CloudDiagramDocument) => {
        hydrateCloudDiagramDocument(document, set, themeDefaultColorSchema);
    }, [themeDefaultColorSchema]);
    const hydratedKeyRef = useRef<string | undefined>(undefined);
    const shouldRecoverOnMount = recoverOnMount ?? persistenceMode === PersistenceMode.Local;

    useEffect(() => {
        onLayoutChange?.(appLayout);
    }, [appLayout, onLayoutChange]);

    useEffect(() => {
        if (persistenceMode === PersistenceMode.Host) return;
        try {
            const toSave = {
                propsPaneOpen: appLayout.propsPaneOpen,
                propsDrawerWidth: appLayout.propsDrawerWidth,
                themeId: appLayout.themeId,
                showGrid: appLayout.showGrid,
            };
            localStorage.setItem(APP_LAYOUT_STORAGE_KEY, JSON.stringify(toSave));
        } catch {}
    }, [appLayout, persistenceMode]);

    useEffect(() => {
        const hostThemeId = resolveThemeIdFromHost(theme);
        if (hostThemeId !== undefined) {
            setAppLayout(prev => ({...prev, themeId: hostThemeId, darkMode: isDarkThemeId(hostThemeId)}));
        }
    }, [theme?.themeId, theme?.darkMode]);

    useEffect(() => {
        setAppLayout(prev => ({...prev, canvasBackground: theme?.canvasBackground}));
    }, [theme?.canvasBackground]);

    useEffect(() => {
        store.set(
            defaultColorSchemaAtom,
            themeDefaultColorSchema ? {...themeDefaultColorSchema, rawColors: true} : defaultColorSchema
        );
    }, [store, themeDefaultColorSchema]);

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

    useEffect(() => {
        applyTheme(appLayout.themeId);
    }, [appLayout.themeId]);

    return (
        <AppLayoutContext.Provider value={contextValue}>
            <div className="cd-canvas-root" style={{height}}>
                <KeyboardShortcuts/>
                {onChange && <CloudDiagramDocumentChangeObserver onChange={onChange}/>}
                {header}
                <div className="cd-canvas-body">
                    <main
                        className={"cd-canvas-main" + (drawerOpen ? " cd-canvas-main--open" : "")}
                        style={{marginRight: drawerOpen ? drawerWidth : 0}}
                    >
                        <div className="cd-canvas-row">
                            <Toolbox/>
                            <div className="cd-canvas-divider"/>
                            <DiagramTabs/>
                        </div>
                    </main>
                    {showPropertiesPane && <PropertiesDrawer/>}
                </div>
            </div>
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
