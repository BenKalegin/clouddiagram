import {exportSequenceDiagramAsPlantUml} from "./plantUmlSequenceFormat";
import {Diagram} from "../../common/model";
import {ElementType} from "../../package/packageModel";
import {exportSequenceDiagramAsLucid} from "./lucidSequenceFormat";
import {exportAsPng} from "./pngFormat";
import Konva from "konva";
import Stage = Konva.Stage;
import {exportAsSvg} from "./svgFormat";

export enum ExportImportFormat {
    PlantUmlSequenceDiagram = "plantuml_sequence",
    LucidChartSequenceDiagram = "lucid_sequence",
    Png = "png",
    Svg = "svg",
}


interface exportRegistryEntry {
    format: ExportImportFormat;
    name: string;
    supportedDiagram: ElementType[];
    exportFunction?: (diagram: Diagram, stage: Stage) => Promise<string>;
    importFunction?: (diagram: Diagram, content: string) => void;
}

const formatRegistry: exportRegistryEntry[] = [
    {
        format: ExportImportFormat.PlantUmlSequenceDiagram,
        name: "PlantUML",
        exportFunction: async (diagram: Diagram, stage: Stage) => exportSequenceDiagramAsPlantUml(diagram),
        supportedDiagram: [ElementType.SequenceDiagram]
    },
    {
        format: ExportImportFormat.LucidChartSequenceDiagram,
        name: "Lucid Charts",
        exportFunction: async (diagram: Diagram, stage: Stage) => exportSequenceDiagramAsLucid(diagram),
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

export async function exportDiagramAs(diagram: Diagram, kind: ExportImportFormat, stage: Stage): Promise<string> {
    const entry = formatRegistry.find(e => e.format === kind);
    if (!entry)
        throw new Error("Unknown export kind " + kind);
    return await entry.exportFunction!(diagram, stage);
}

export function importDiagramAs(diagram: Diagram, kind: ExportImportFormat, content: string): void {
    const entry = formatRegistry.find(e => e.format === kind);
    if (!entry)
        throw new Error("Unknown export kind " + kind);
    return entry.importFunction!(diagram, content);
}

