import Konva from "konva";
import Stage = Konva.Stage;
import { Diagram } from "../../common/model";
import { ElementType } from "../../package/packageModel";
import {
    DiagramImportResult,
    ElementResolver,
    exportDiagramAs,
    exportFormats,
    ExportImportFormat,
    importDiagramAs,
    importFormats
} from "../../features/export/exportFormats";

export { ExportImportFormat };

/**
 * Service wrapper around shared export/import helpers.
 */
export class ExportService {
    static getExportFormats(diagramType: ElementType): [ExportImportFormat, string][] {
        return exportFormats(diagramType);
    }

    static getImportFormats(diagramType: ElementType): [ExportImportFormat, string][] {
        return importFormats(diagramType);
    }

    static async exportDiagram(
        diagram: Diagram,
        format: ExportImportFormat,
        stage: Stage,
        resolveElement?: ElementResolver
    ): Promise<string> {
        return exportDiagramAs(diagram, format, stage, resolveElement);
    }

    static importDiagram(diagram: Diagram, format: ExportImportFormat, content: string): DiagramImportResult {
        return importDiagramAs(diagram, format, content);
    }
}
