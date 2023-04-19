import {exportSequenceDiagramAsPlantUml} from "./plantUmlSequenceFormat";
import {Diagram} from "../../common/model";
import {ElementType} from "../../package/packageModel";
import {exportSequenceDiagramAsLucid} from "./lucidSequenceFormat";
import {exportAsPng} from "./pngFormat";
import Konva from "konva";
import Stage = Konva.Stage;

export enum ExportKind {
    PlantUmlSequenceDiagram = "plantuml_sequence",
    LucidChartSequenceDiagram = "lucid_sequence",
    Png = "png",
}


interface exportRegistryEntry {
    kind: ExportKind;
    name: string;
    supportedDiagram: ElementType[];
    exportFunction: (diagram: Diagram, stage: Stage) => string;
}

const exportRegistry: exportRegistryEntry[] = [
    {
        kind: ExportKind.PlantUmlSequenceDiagram,
        name: "PlantUML",
        exportFunction: exportSequenceDiagramAsPlantUml,
        supportedDiagram: [ElementType.SequenceDiagram]
    },
    {
        kind: ExportKind.LucidChartSequenceDiagram,
        name: "Lucid Charts",
        exportFunction: exportSequenceDiagramAsLucid,
        supportedDiagram: [ElementType.SequenceDiagram]
    },
    {
        kind: ExportKind.Png,
        name: "PNG image",
        exportFunction: exportAsPng,
        supportedDiagram: [ElementType.SequenceDiagram, ElementType.ClassDiagram]
    },
];
export function exportFormats(diagramType: ElementType): [ExportKind, string][] {
    return exportRegistry.filter(e => e.supportedDiagram.includes(diagramType)).map(e => [e.kind, e.name]);
}

export function exportDiagramAs(diagram: Diagram, kind: ExportKind, stage: Stage): string {
    const entry = exportRegistry.find(e => e.kind === kind);
    if (!entry)
        throw new Error("Unknown export kind " + kind);
    return entry.exportFunction(diagram, stage);
}

