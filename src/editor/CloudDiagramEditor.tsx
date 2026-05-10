import { useContext } from "react";
import { IconButton } from "@benkalegin/ui26";
import { ChevronRight, Grid3x3, Moon, Save, Sun } from "@benkalegin/ui26/icons";
import {
    AppLayoutContext,
    toggleDarkMode,
    togglePropertiesPane,
    toggleShowGrid
} from "./editorLayout";
import { UndoRedoControls } from "../features/diagramEditor/UndoRedoControls";
import { CloudDiagramCanvas, CloudDiagramCanvasProps } from "./CloudDiagramCanvas";
import { CloudDiagramDocument } from "../features/export/CloudDiagramFormat";
import { getCloudDiagramDocument } from "./documentAdapter";
import { useStoreCallback } from "../common/state/jotaiShim";
import "./CloudDiagramEditor.css";

export interface CloudDiagramEditorProps extends CloudDiagramCanvasProps {
    title?: string;
    onSave?: (document: CloudDiagramDocument) => void;
}

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

function EditorTopBar({ title, onSave }: EditorTopBarProps) {
    const { appLayout, setAppLayout } = useContext(AppLayoutContext);

    const handleSave = useStoreCallback(({ get }) => () => {
        if (!onSave) return;
        const document = getCloudDiagramDocument(get);
        if (document) onSave(document);
    }, [onSave]);

    return (
        <header className="cd-editor-topbar">
            <h1 className="cd-editor-topbar__title">{title}</h1>
            <div className="cd-editor-topbar__actions">
                <UndoRedoControls/>
                {onSave && (
                    <IconButton aria-label="Save" onClick={handleSave}>
                        <Save size={20}/>
                    </IconButton>
                )}
                <IconButton
                    aria-label={appLayout.darkMode ? "Switch to light mode" : "Switch to dark mode"}
                    onClick={() => setAppLayout(toggleDarkMode(appLayout))}
                >
                    {appLayout.darkMode ? <Sun size={20}/> : <Moon size={20}/>}
                </IconButton>
                <IconButton
                    aria-label={appLayout.showGrid ? "Hide grid" : "Show grid"}
                    onClick={() => setAppLayout(toggleShowGrid(appLayout))}
                    style={{ opacity: appLayout.showGrid ? 1 : 0.5 }}
                >
                    <Grid3x3 size={20}/>
                </IconButton>
                <IconButton
                    aria-label="Toggle properties pane"
                    onClick={() => setAppLayout(togglePropertiesPane(appLayout))}
                >
                    <ChevronRight size={20}/>
                </IconButton>
            </div>
        </header>
    );
}
