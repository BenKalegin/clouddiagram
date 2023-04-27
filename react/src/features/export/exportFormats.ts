import {exportSequenceDiagramAsPlantUml} from "./plantUmlSequenceFormat";
import {Diagram} from "../../common/model";
import {ElementType} from "../../package/packageModel";
import {exportSequenceDiagramAsLucid} from "./lucidSequenceFormat";
import {exportAsPng} from "./pngFormat";
import Konva from "konva";
import Stage = Konva.Stage;

export enum ExportImportFormat {
    PlantUmlSequenceDiagram = "plantuml_sequence",
    LucidChartSequenceDiagram = "lucid_sequence",
    Png = "png",
}


interface exportRegistryEntry {
    format: ExportImportFormat;
    name: string;
    supportedDiagram: ElementType[];
    exportFunction?: (diagram: Diagram, stage: Stage) => string;
    importFunction?: (diagram: Diagram, content: string) => void;
}

const formatRegistry: exportRegistryEntry[] = [
    {
        format: ExportImportFormat.PlantUmlSequenceDiagram,
        name: "PlantUML",
        exportFunction: exportSequenceDiagramAsPlantUml,
        supportedDiagram: [ElementType.SequenceDiagram]
    },
    {
        format: ExportImportFormat.LucidChartSequenceDiagram,
        name: "Lucid Charts",
        exportFunction: exportSequenceDiagramAsLucid,
        supportedDiagram: [ElementType.SequenceDiagram]
    },
    {
        format: ExportImportFormat.Png,
        name: "PNG image",
        exportFunction: exportAsPng,
        supportedDiagram: [ElementType.SequenceDiagram, ElementType.ClassDiagram]
    },
];
export function exportFormats(diagramType: ElementType): [ExportImportFormat, string][] {
    return formatRegistry
        .filter(e => e.supportedDiagram.includes(diagramType) && e.exportFunction)
        .map(e => [e.format, e.name]);
}

export function importFormats(diagramType: ElementType): [ExportImportFormat, string][] {
    return formatRegistry
        .filter(e => e.supportedDiagram.includes(diagramType) && e.importFunction)
        .map(e => [e.format, e.name]);
}

export function exportDiagramAs(diagram: Diagram, kind: ExportImportFormat, stage: Stage): string {
    const entry = formatRegistry.find(e => e.format === kind);
    if (!entry)
        throw new Error("Unknown export kind " + kind);
    return entry.exportFunction!(diagram, stage);
}

export function importDiagramAs(diagram: Diagram, kind: ExportImportFormat, content: string): void {
    const entry = formatRegistry.find(e => e.format === kind);
    if (!entry)
        throw new Error("Unknown export kind " + kind);
    return entry.importFunction!(diagram, content);
}

