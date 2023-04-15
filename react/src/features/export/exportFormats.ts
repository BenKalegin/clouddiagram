import {exportSequenceDiagramAsPlantUml} from "./plantUmlSequenceFormat";
import {Diagram} from "../../common/model";

export enum ExportKind {
    PlantUmlSequenceDiagram= "plantuml_sequence",
}


interface exportRegistryEntry {
    kind: ExportKind;
    name: string;
    exportFunction: (diagram: Diagram) => string;
}

const exportRegistry: exportRegistryEntry[] = [
    {
        kind: ExportKind.PlantUmlSequenceDiagram,
        name: "PlantUML",
        exportFunction: exportSequenceDiagramAsPlantUml,
    },
];
export const exportFormats: [ExportKind, string][] =
    exportRegistry.map(e => [e.kind, e.name]);

export function exportDiagramAs(diagram: Diagram, kind: ExportKind): string {
    const entry = exportRegistry.find(e => e.kind === kind);
    if (!entry)
        throw new Error("Unknown export kind " + kind);
    return entry.exportFunction(diagram);
}

