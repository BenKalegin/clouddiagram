import { exportSequenceDiagramAsPlantUml } from "../../features/export/plantUmlSequenceFormat";
import { Diagram } from "../../common/model";
import { ElementType } from "../../package/packageModel";
import { exportSequenceDiagramAsLucid } from "../../features/export/lucidSequenceFormat";
import { exportAsPng } from "../../features/export/pngFormat";
import Konva from "konva";
import Stage = Konva.Stage;
import { exportAsSvg } from "../../features/export/svgFormat";
import { exportAsCloudDiagram, importCloudDiagram } from "../../features/export/CloudDiagramFormat";

/**
 * Enum defining supported export/import formats
 */
export enum ExportImportFormat {
    PlantUmlSequenceDiagram = "plantuml_sequence",
    LucidChartSequenceDiagram = "lucid_sequence",
    Png = "png",
    Svg = "svg",
    CloudDiagram = "cd",
}

/**
 * Interface defining the structure of export registry entries
 */
interface ExportRegistryEntry {
    format: ExportImportFormat;
    name: string;
    supportedDiagram: ElementType[];
    exportFunction?: (diagram: Diagram, stage: Stage) => Promise<string>;
    importFunction?: (diagram: Diagram, content: string) => Diagram;
}

/**
 * Export service for exporting and importing diagrams in various formats
 */
export class ExportService {
    /**
     * Registry of supported export/import formats
     */
    private static formatRegistry: ExportRegistryEntry[] = [
        {
            format: ExportImportFormat.PlantUmlSequenceDiagram,
            name: "PlantUML",
            exportFunction: async (diagram: Diagram) => exportSequenceDiagramAsPlantUml(diagram),
            supportedDiagram: [ElementType.SequenceDiagram]
        },
        {
            format: ExportImportFormat.LucidChartSequenceDiagram,
            name: "Lucid Charts",
            exportFunction: async (diagram: Diagram) => exportSequenceDiagramAsLucid(diagram),
            supportedDiagram: [ElementType.SequenceDiagram]
        },
        {
            format: ExportImportFormat.Png,
            name: "PNG image",
            exportFunction: async (diagram: Diagram, stage: Stage) => exportAsPng(diagram, stage),
            supportedDiagram: [ElementType.SequenceDiagram, ElementType.ClassDiagram, ElementType.DeploymentDiagram]
        },
        {
            format: ExportImportFormat.Svg,
            name: "SVG file",
            exportFunction: exportAsSvg,
            supportedDiagram: [ElementType.SequenceDiagram, ElementType.ClassDiagram, ElementType.DeploymentDiagram]
        },
        {
            format: ExportImportFormat.CloudDiagram,
            name: "CloudDiagram file",
            exportFunction: async (diagram: Diagram, stage: Stage) => exportAsCloudDiagram(diagram, stage),
            importFunction: importCloudDiagram,
            supportedDiagram: [ElementType.SequenceDiagram, ElementType.ClassDiagram, ElementType.DeploymentDiagram]
        },
    ];

    /**
     * Gets the supported export formats for a diagram type
     * @param diagramType The diagram type
     * @returns An array of supported export formats and their names
     */
    static getExportFormats(diagramType: ElementType): [ExportImportFormat, string][] {
        return this.formatRegistry
            .filter(e => e.supportedDiagram.includes(diagramType) && e.exportFunction)
            .map(e => [e.format, e.name]);
    }

    /**
     * Gets the supported import formats for a diagram type
     * @param diagramType The diagram type
     * @returns An array of supported import formats and their names
     */
    static getImportFormats(diagramType: ElementType): [ExportImportFormat, string][] {
        return this.formatRegistry
            .filter(e => e.supportedDiagram.includes(diagramType) && e.importFunction)
            .map(e => [e.format, e.name]);
    }

    /**
     * Exports a diagram in the specified format
     * @param diagram The diagram to export
     * @param format The format to export to
     * @param stage The Konva stage
     * @returns A promise that resolves to the exported content
     */
    static async exportDiagram(diagram: Diagram, format: ExportImportFormat, stage: Stage): Promise<string> {
        const entry = this.formatRegistry.find(e => e.format === format);
        if (!entry)
            throw new Error("Unknown export format " + format);
        return await entry.exportFunction!(diagram, stage);
    }

    /**
     * Imports a diagram from the specified format
     * @param diagram The base diagram
     * @param format The format to import from
     * @param content The content to import
     * @returns The imported diagram
     */
    static importDiagram(diagram: Diagram, format: ExportImportFormat, content: string): Diagram {
        const entry = this.formatRegistry.find(e => e.format === format);
        if (!entry)
            throw new Error("Unknown import format " + format);
        return entry.importFunction!(diagram, content);
    }
}