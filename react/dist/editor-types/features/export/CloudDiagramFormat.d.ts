import { Diagram } from "../../common/model";
import { DiagramElement, Id } from "../../package/packageModel";
import type Konva from "konva";
type Stage = Konva.Stage;
export declare const CLOUD_DIAGRAM_SCHEMA_VERSION = 1;
export interface CloudDiagramDocument {
    schemaVersion: typeof CLOUD_DIAGRAM_SCHEMA_VERSION;
    diagram: Diagram;
    elements: Record<Id, DiagramElement>;
}
export interface CloudDiagramImportResult {
    diagram: Diagram;
    elements: Record<Id, DiagramElement>;
}
export type ElementResolver = (id: Id) => DiagramElement | undefined;
export declare function exportAsCloudDiagram(baseDiagram: Diagram, _stage?: Stage | null, resolveElement?: ElementResolver): string;
export declare function createCloudDiagramDocument(baseDiagram: Diagram, resolveElement?: ElementResolver): CloudDiagramDocument;
export declare function importCloudDiagram(baseDiagram: Diagram, content: string): CloudDiagramImportResult;
export {};
//# sourceMappingURL=CloudDiagramFormat.d.ts.map