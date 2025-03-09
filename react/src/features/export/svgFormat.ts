import {Diagram} from "../../common/model";
import Konva from "konva";
import Stage = Konva.Stage;
import { exportStageSVG } from "react-konva-to-svg";

export function exportAsSvg(baseDiagram: Diagram, stage: Stage): Promise<string> {
    const result = exportStageSVG(stage, false, {
                onBefore: ([stage, layer]) => {
                        // disable shadows
                },
                onAfter: ([stage, layer]) => {
                        // Perform actions after export
                },
    });
    return result.then(data => {
        if (data instanceof Blob) {
            return new Promise<string>(resolve => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.readAsText(data);
            });
        }
        return data;
    });
}
