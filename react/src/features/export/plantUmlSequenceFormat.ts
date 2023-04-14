
import {SequenceDiagramState} from "../sequenceDiagram/sequenceDiagramModel";
import {Diagram} from "../../common/model";

export function exportSequenceDiagramAsPlantUml(baseDiagram: Diagram): string {
    const diagram = baseDiagram as SequenceDiagramState;
    const lifelines = diagram.lifelines;

    const lines: string[] = [];

    // noinspection SpellCheckingInspection
    lines.push(`@startuml`);

    Object.values(lifelines)
        .sort((a, b) => a.placement.headBounds.x - b.placement.headBounds.x)
        .forEach(lifeline => {
            lines.push(`${lifeline.title} ${lifeline.title} `); // to lifeline
    })

    // noinspection SpellCheckingInspection
    lines.push(`@enduml`);
    return lines.join("\n");
}
