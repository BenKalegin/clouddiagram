import {Arrow} from "react-konva";
import {
    drawingMessageRenderSelector
} from "./sequenceDiagramModel";
import {useRecoilValue} from "recoil";

export const DrawingMessage = () => {
    const render = useRecoilValue(drawingMessageRenderSelector)

    if (!render) {
        return null
    }

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

            x={render.bounds.x}
            y={render.bounds.y}
            points={render.points}
        />
    )

}
