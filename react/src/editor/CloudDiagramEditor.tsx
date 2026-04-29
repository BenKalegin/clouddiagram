import React, {useContext} from "react";
import {AppBar, IconButton, Stack, Toolbar, Typography} from "@mui/material";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import GridOnIcon from "@mui/icons-material/GridOn";
import GridOffIcon from "@mui/icons-material/GridOff";
import SaveIcon from "@mui/icons-material/Save";
import {
    AppLayoutContext,
    toggleDarkMode,
    togglePropertiesPane,
    toggleShowGrid
} from "./editorLayout";
import {UndoRedoControls} from "../features/diagramEditor/UndoRedoControls";
import {CloudDiagramCanvas, CloudDiagramCanvasProps} from "./CloudDiagramCanvas";
import {CloudDiagramDocument} from "../features/export/CloudDiagramFormat";
import {getCloudDiagramDocument} from "./documentAdapter";
import {useStoreCallback} from "../common/state/jotaiShim";

const TOP_BAR_HEIGHT = 64;

export interface CloudDiagramEditorProps extends CloudDiagramCanvasProps {
    title?: string;
    onSave?: (document: CloudDiagramDocument) => void;
}

/**
 * Standalone-app shell around `CloudDiagramCanvas`. Renders an MUI AppBar with
 * title, save, theme toggle, grid toggle, and properties-pane toggle.
 *
 * Embedders that don't want the AppBar should use `CloudDiagramCanvas` directly
 * and compose their own chrome.
 */
export function CloudDiagramEditor({
    title = "Cloud Diagram",
    onSave,
    height = "100vh",
    ...canvasProps
}: CloudDiagramEditorProps) {
    return (
        <CloudDiagramCanvas
            {...canvasProps}
            height={height}
            header={<EditorTopBar title={title} onSave={onSave}/>}
        />
    );
}

interface EditorTopBarProps {
    title: string;
    onSave?: (document: CloudDiagramDocument) => void;
}

function EditorTopBar({title, onSave}: EditorTopBarProps) {
    const {appLayout, setAppLayout} = useContext(AppLayoutContext);

    const handleSave = useStoreCallback(({get}) => () => {
        if (!onSave) return;
        const document = getCloudDiagramDocument(get);
        if (document) onSave(document);
    }, [onSave]);

    return (
        <AppBar
            position="static"
            sx={{height: TOP_BAR_HEIGHT, flexShrink: 0, zIndex: (theme) => theme.zIndex.drawer + 1}}
        >
            <Toolbar sx={{justifyContent: "space-between"}}>
                <Typography variant="h6" noWrap component="div">
                    {title}
                </Typography>
                <Stack direction="row" spacing={1}>
                    <UndoRedoControls/>
                    {onSave && (
                        <IconButton onClick={handleSave} color="inherit">
                            <SaveIcon/>
                        </IconButton>
                    )}
                    <IconButton onClick={() => setAppLayout(toggleDarkMode(appLayout))} color="inherit">
                        {appLayout.darkMode ? <Brightness7Icon/> : <Brightness4Icon/>}
                    </IconButton>
                    <IconButton onClick={() => setAppLayout(toggleShowGrid(appLayout))} color="inherit">
                        {appLayout.showGrid ? <GridOnIcon/> : <GridOffIcon/>}
                    </IconButton>
                    <IconButton
                        onClick={() => setAppLayout(togglePropertiesPane(appLayout))}
                        color="inherit"
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
