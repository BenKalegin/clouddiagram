import {exportSequenceDiagramAsPlantUml} from "./plantUmlSequenceFormat";
import {Diagram} from "../../common/model";
import {ElementType} from "../../package/packageModel";
import {exportSequenceDiagramAsLucid} from "./lucidSequenceFormat";
import {exportAsPng} from "./pngFormat";
import Konva from "konva";
import Stage = Konva.Stage;
import {exportAsSvg} from "./svgFormat";
import {
    CloudDiagramImportResult,
    ElementResolver,
    exportAsCloudDiagram,
    importCloudDiagram
} from "./CloudDiagramFormat";
import {importMermaidFlowchartDiagram, importMermaidSequenceDiagram, importMermaidStructureDiagram} from "./mermaidFormat";

export type {ElementResolver};

export enum ExportImportFormat {
    PlantUmlSequenceDiagram = "plantuml_sequence",
    LucidChartSequenceDiagram = "lucid_sequence",
    Png = "png",
    Svg = "svg",
    CloudDiagram = "cd",
    MermaidSequenceDiagram = "mermaid_sequence",
    MermaidStructureDiagram = "mermaid_structure",
    MermaidFlowchartDiagram = "mermaid_flowchart",
}

export interface DiagramExportContext {
    stage?: Stage | null;
    resolveElement?: ElementResolver;
}

export type DiagramImportResult = CloudDiagramImportResult;

type ImportedDiagram = Diagram | DiagramImportResult;

interface ExportRegistryEntry {
    format: ExportImportFormat;
    name: string;
    supportedDiagram: ElementType[];
    exportFunction?: (diagram: Diagram, context: DiagramExportContext) => Promise<string>;
    importFunction?: (diagram: Diagram, content: string) => ImportedDiagram;
}

export const formatRegistry: ExportRegistryEntry[] = [
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
        exportFunction: async (diagram: Diagram, {stage}) => exportAsPng(diagram, requireStage(stage, "PNG")),
        supportedDiagram: [ElementType.SequenceDiagram, ElementType.ClassDiagram, ElementType.DeploymentDiagram, ElementType.FlowchartDiagram]
    },
    {
        format: ExportImportFormat.Svg,
        name: "SVG file",
        exportFunction: async (diagram: Diagram, {stage}) => exportAsSvg(diagram, requireStage(stage, "SVG")),
        supportedDiagram: [ElementType.SequenceDiagram, ElementType.ClassDiagram, ElementType.DeploymentDiagram, ElementType.FlowchartDiagram]
    },
    {
        format: ExportImportFormat.CloudDiagram,
        name: "CloudDiagram file",
        exportFunction: async (diagram: Diagram, {stage, resolveElement}) => exportAsCloudDiagram(diagram, stage, resolveElement),
        importFunction: importCloudDiagram,
        supportedDiagram: [ElementType.SequenceDiagram, ElementType.ClassDiagram, ElementType.DeploymentDiagram, ElementType.FlowchartDiagram]
    },
    {
        format: ExportImportFormat.MermaidSequenceDiagram,
        name: "Mermaid Sequence Diagram",
        importFunction: importMermaidSequenceDiagram,
        supportedDiagram: [ElementType.SequenceDiagram]
    },
    {
        format: ExportImportFormat.MermaidStructureDiagram,
        name: "Mermaid Class Diagram",
        importFunction: importMermaidStructureDiagram,
        supportedDiagram: [ElementType.ClassDiagram, ElementType.DeploymentDiagram]
    },
    {
        format: ExportImportFormat.MermaidFlowchartDiagram,
        name: "Mermaid Flowchart (UML/C4)",
        importFunction: importMermaidFlowchartDiagram,
        supportedDiagram: [ElementType.FlowchartDiagram]
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

export async function exportDiagramAs(
    diagram: Diagram,
    kind: ExportImportFormat,
    stage?: Stage | null,
    resolveElement?: ElementResolver
): Promise<string> {
    const entry = formatRegistry.find(e => e.format === kind);
    if (!entry)
        throw new Error("Unknown export kind " + kind);
    return await entry.exportFunction!(diagram, {stage, resolveElement});
}

export function importDiagramAs(diagram: Diagram, kind: ExportImportFormat, content: string): DiagramImportResult {
    const entry = formatRegistry.find(e => e.format === kind);
    if (!entry)
        throw new Error("Unknown export kind " + kind);
    return toDiagramImportResult(entry.importFunction!(diagram, content));
}

function toDiagramImportResult(imported: ImportedDiagram): DiagramImportResult {
    if (isDiagramImportResult(imported)) {
        return imported;
    }

    const importedWithElements = imported as Diagram & { elements?: DiagramImportResult["elements"] };
    const {elements = {}, ...diagram} = importedWithElements;
    return {
        diagram: diagram as Diagram,
        elements
    };
}

function isDiagramImportResult(value: ImportedDiagram): value is DiagramImportResult {
    return "diagram" in value && "elements" in value;
}

function requireStage(stage: Stage | null | undefined, formatName: string): Stage {
    if (!stage) {
        throw new Error(`${formatName} export requires a Konva stage`);
    }
    return stage;
}
