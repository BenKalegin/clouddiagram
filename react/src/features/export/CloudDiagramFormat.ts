import {Diagram} from "../../common/model";
import Konva from "konva";
import Stage = Konva.Stage;

export function exportAsCloudDiagram(baseDiagram: Diagram, stage: Stage): string {
    return JSON.stringify(baseDiagram, null, 2);
}

export function importCloudDiagram(baseDiagram: Diagram, content: string): Diagram {
    return JSON.parse(content) as Diagram;
}
