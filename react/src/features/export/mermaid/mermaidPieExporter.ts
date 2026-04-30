import {Diagram} from "../../../common/model";
import {PieChartDiagramState} from "../../pieChartDiagram/pieChartDiagramModel";
import {escapePieLabel, formatPieValue, normalizedPieSlices} from "../../pieChartDiagram/pieChartDiagramUtils";

export function exportPieChartDiagramAsMermaid(diagram: Diagram): string {
    const pieDiagram = diagram as PieChartDiagramState;
    const lines = [pieDiagram.pie.showData ? "pie showData" : "pie"];
    const title = (pieDiagram.title ?? "").trim();
    if (title) {
        lines.push(`    title ${title.replace(/[\r\n]+/g, " ")}`);
    }

    normalizedPieSlices(pieDiagram.pie.slices).forEach(slice => {
        lines.push(`    "${escapePieLabel(slice.label)}" : ${formatPieValue(slice.value)}`);
    });

    return `${lines.join("\n")}\n`;
}
