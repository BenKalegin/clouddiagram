import React from "react";
import { AppLayout } from "./editorLayout";
import { CloudDiagramDocument } from "../features/export/CloudDiagramFormat";
import { PersistenceMode } from "../services/persistence/persistenceService";
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
export declare function CloudDiagramEditor({ value, valueVersion, persistenceMode, ...props }: CloudDiagramEditorProps): JSX.Element;
//# sourceMappingURL=CloudDiagramEditor.d.ts.map