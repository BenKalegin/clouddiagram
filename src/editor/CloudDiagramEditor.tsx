import {useContext, useState} from "react";
import {IconButton} from "@benkalegin/ui26";
import {ChevronRight, Save} from "@benkalegin/ui26/icons";
import {AppLayoutContext, togglePropertiesPane} from "./editorLayout";
import {UndoRedoControls} from "../features/diagramEditor/UndoRedoControls";
import {DiagramTabBar} from "../features/diagramTabs/DiagramTabBar";
import {CloudDiagramCanvas, CloudDiagramCanvasProps} from "./CloudDiagramCanvas";
import {CloudDiagramDocument} from "../features/export/CloudDiagramFormat";
import {getCloudDiagramDocument} from "./documentAdapter";
import {useStoreCallback} from "../common/state/jotaiShim";
import {SettingsDialog} from "./SettingsDialog";
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

function EditorTopBar({title, onSave}: EditorTopBarProps) {
    const {appLayout, setAppLayout} = useContext(AppLayoutContext);
    const [settingsOpen, setSettingsOpen] = useState(false);

    const handleSave = useStoreCallback(({get}) => () => {
        if (!onSave) return;
        const document = getCloudDiagramDocument(get);
        if (document) onSave(document);
    }, [onSave]);

    return (
        <header className="cd-editor-topbar">
            <h1 className="cd-editor-topbar__title">{title}</h1>
            <div className="cd-editor-topbar__tabs">
                <DiagramTabBar/>
            </div>
            <div className="cd-editor-topbar__actions">
                <UndoRedoControls/>
                {onSave && (
                    <IconButton aria-label="Save" onClick={handleSave}>
                        <Save size={20}/>
                    </IconButton>
                )}
                <IconButton aria-label="Settings" onClick={() => setSettingsOpen(true)}>
                    <SettingsIcon size={20}/>
                </IconButton>
                <IconButton
                    aria-label="Toggle properties pane"
                    onClick={() => setAppLayout(togglePropertiesPane(appLayout))}
                >
                    <ChevronRight size={20}/>
                </IconButton>
            </div>
            <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)}/>
        </header>
    );
}

function SettingsIcon({size = 20}: {size?: number}) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
            <circle cx="12" cy="12" r="3"/>
        </svg>
    );
}
