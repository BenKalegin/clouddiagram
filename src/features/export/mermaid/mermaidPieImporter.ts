import {Diagram} from "../../../common/model";
import {ElementType, PieSliceState} from "../../../package/packageModel";
import {PieChartDiagramState, defaultPieChartBounds} from "../../pieChartDiagram/pieChartDiagramModel";
import {parsePieSliceLine} from "../../pieChartDiagram/pieChartDiagramUtils";
import {mermaidSourceLines} from "./mermaidImportUtils";

export function importMermaidPieChartDiagram(baseDiagram: Diagram, content: string): Diagram {
    const lines = mermaidSourceLines(content);
    const headerLine = lines.find(line => line.toLowerCase().startsWith("pie"));
    if (!headerLine) {
        throw new Error("Not a valid Mermaid pie chart diagram");
    }

    let title = baseDiagram.title ?? "Pie Chart";
    let showData = false;
    const slices: PieSliceState[] = [];
    parsePieHeader(headerLine, {
        setTitle: nextTitle => title = nextTitle,
        setShowData: nextShowData => showData = nextShowData
    });

    for (const line of lines) {
        if (line === headerLine) continue;

        const titleMatch = line.match(/^title\s+(.+)$/i);
        if (titleMatch) {
            title = titleMatch[1].trim();
            continue;
        }

        const slice = parsePieSliceLine(line);
        if (slice.label && slice.value > 0) {
            slices.push(slice);
        }
    }

    return {
        ...baseDiagram,
        type: ElementType.PieChartDiagram,
        title,
        pie: {
            showData,
            textPosition: 0.75,
            slices,
            bounds: defaultPieChartBounds
        },
        notes: {},
        selectedElements: [],
        display: {
            ...baseDiagram.display,
            width: Math.max(baseDiagram.display.width, 1000),
            height: Math.max(baseDiagram.display.height, 700),
            offset: {x: 0, y: 0}
        }
    } as PieChartDiagramState;
}

function parsePieHeader(
    headerLine: string,
    handlers: {
        setTitle: (title: string) => void;
        setShowData: (showData: boolean) => void;
    }
): void {
    let remainder = headerLine.replace(/^pie\b/i, "").trim();
    if (!remainder) return;

    const showDataMatch = remainder.match(/^showData\b\s*/i);
    if (showDataMatch) {
        handlers.setShowData(true);
        remainder = remainder.substring(showDataMatch[0].length).trim();
    }

    const titleMatch = remainder.match(/^title\s+(.+)$/i);
    if (titleMatch) {
        handlers.setTitle(titleMatch[1].trim());
    }
}
