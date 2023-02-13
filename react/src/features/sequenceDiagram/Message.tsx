import {Arrow} from "react-konva";
import {useRecoilValue} from "recoil";
import {Id} from "../../package/packageModel";
import {messageRenderSelector} from "./sequenceDiagramModel";
import {DiagramId} from "../diagramEditor/diagramEditorModel";

export const Message = ({messageId, diagramId}: {messageId: Id, diagramId: DiagramId  }) => {
    const render = useRecoilValue(messageRenderSelector({messageId, diagramId}))

    return (
        <Arrow
            fill={"burlywood"}
            stroke={'burlywood'}
            strokeWidth={2}
            pointerLength={8}
            pointerWidth={6}
            tension={undefined}
            closed={undefined}
            pointerAtBeginning={false}
            pointerAtEnding={true}

            x={render.x}
            y={render.y}
            points={render.points}
        />
    )
}
