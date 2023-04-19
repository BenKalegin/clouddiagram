import {Diagram} from "../../common/model";
import Konva from "konva";
import Stage = Konva.Stage;

export function exportAsPng(baseDiagram: Diagram, stage: Stage): string {
        if (!stage)
            return "";

        // Convert the stage to a data URL
        const dataUrl = stage.toDataURL({ pixelRatio: 2 });

        // Create a link element
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = 'stage.png';

        // Trigger the download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return "Saved as png";
}
