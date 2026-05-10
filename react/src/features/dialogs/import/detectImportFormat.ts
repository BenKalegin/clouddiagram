import {ElementType} from "../../../package/packageModel";
import {ExportImportFormat, formatRegistry, importFormats} from "../../export/exportFormats";
import {detectMermaidDiagramType, MermaidDiagramKind} from "../../export/mermaidFormat";

export type DetectionConfidence = "detected" | "ambiguous" | "mismatch" | "unknown" | "empty";

export interface FormatDetection {
    /** Best-guess format compatible with the current diagramKind, undefined when unknown */
    format?: ExportImportFormat;
    /** Human label for what was detected, e.g. "CloudDiagram", "Mermaid Sequence Diagram" */
    detectedLabel?: string;
    /** Confidence/state of the detection */
    confidence: DetectionConfidence;
    /** When the user wants to override, these are the format choices that match the detected source */
    candidates: ExportImportFormat[];
    /** Optional message shown beside the status (e.g. why mismatch) */
    message?: string;
}

const MERMAID_KIND_TO_FORMATS: Record<MermaidDiagramKind, ExportImportFormat[]> = {
    flowchart: [ExportImportFormat.MermaidDiagram, ExportImportFormat.MermaidFlowchartDiagram, ExportImportFormat.MermaidStructureDiagram],
    sequence: [ExportImportFormat.MermaidSequenceDiagram, ExportImportFormat.MermaidDiagram],
    class: [ExportImportFormat.MermaidStructureDiagram, ExportImportFormat.MermaidDiagram],
    state: [ExportImportFormat.MermaidDiagram],
    er: [ExportImportFormat.MermaidErDiagram, ExportImportFormat.MermaidDiagram],
    journey: [ExportImportFormat.MermaidDiagram],
    gantt: [ExportImportFormat.MermaidGanttDiagram, ExportImportFormat.MermaidDiagram],
    pie: [ExportImportFormat.MermaidPieChartDiagram, ExportImportFormat.MermaidDiagram],
    quadrant: [ExportImportFormat.MermaidDiagram],
    requirement: [ExportImportFormat.MermaidDiagram],
    gitgraph: [ExportImportFormat.MermaidDiagram],
    c4: [ExportImportFormat.MermaidFlowchartDiagram, ExportImportFormat.MermaidDiagram],
    mindmap: [ExportImportFormat.MermaidMindMapDiagram, ExportImportFormat.MermaidDiagram],
    timeline: [ExportImportFormat.MermaidDiagram],
    zenuml: [ExportImportFormat.MermaidDiagram],
    sankey: [ExportImportFormat.MermaidDiagram],
    xychart: [ExportImportFormat.MermaidDiagram],
    block: [ExportImportFormat.MermaidDiagram],
    packet: [ExportImportFormat.MermaidDiagram],
    kanban: [ExportImportFormat.MermaidDiagram],
    architecture: [ExportImportFormat.MermaidDiagram],
    radar: [ExportImportFormat.MermaidDiagram],
    treemap: [ExportImportFormat.MermaidDiagram],
    venn: [ExportImportFormat.MermaidDiagram],
    ishikawa: [ExportImportFormat.MermaidDiagram],
    treeview: [ExportImportFormat.MermaidDiagram],
};

export function formatLabel(format: ExportImportFormat): string {
    return formatRegistry.find(e => e.format === format)?.name ?? format;
}

function looksLikeCloudDiagramJson(content: string): boolean {
    const trimmed = content.trim();
    if (!trimmed.startsWith("{")) return false;
    try {
        const parsed = JSON.parse(trimmed);
        if (!parsed || typeof parsed !== "object") return false;
        // CloudDiagramDocument has schemaVersion + diagram, or a legacy Diagram with id+type+title
        if ("schemaVersion" in parsed && "diagram" in parsed) return true;
        return "id" in parsed && "type" in parsed;
    } catch {
        return false;
    }
}

export function detectImportFormat(content: string, diagramKind: ElementType): FormatDetection {
    if (!content.trim()) {
        return {confidence: "empty", candidates: []};
    }

    const supported = importFormats(diagramKind).map(([f]) => f);

    if (looksLikeCloudDiagramJson(content)) {
        const matches = supported.includes(ExportImportFormat.CloudDiagram);
        return {
            format: matches ? ExportImportFormat.CloudDiagram : undefined,
            detectedLabel: "CloudDiagram",
            confidence: matches ? "detected" : "mismatch",
            candidates: matches ? [ExportImportFormat.CloudDiagram] : [],
            message: matches ? undefined : "CloudDiagram import not supported for this diagram type",
        };
    }

    const mermaidType = detectMermaidDiagramType(content);
    if (mermaidType) {
        const candidateFormats = MERMAID_KIND_TO_FORMATS[mermaidType.kind] ?? [];
        const compatible = candidateFormats.filter(f => supported.includes(f));
        if (compatible.length === 0) {
            return {
                detectedLabel: `Mermaid ${mermaidType.name}`,
                confidence: "mismatch",
                candidates: [],
                message: `${mermaidType.name} cannot be imported into a ${diagramKind}`,
            };
        }
        return {
            format: compatible[0],
            detectedLabel: `Mermaid ${mermaidType.name}`,
            confidence: compatible.length > 1 ? "ambiguous" : "detected",
            candidates: compatible,
        };
    }

    return {
        confidence: "unknown",
        candidates: [],
        message: "Could not detect format. Pick one manually.",
    };
}
