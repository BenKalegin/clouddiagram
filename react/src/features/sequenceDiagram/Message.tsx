import {Arrow} from "react-konva";
import {MessageState} from "./model";

export interface MessageProps {
    message: MessageState
}

export const Message = ({message: {placement}}: MessageProps) => {
    return (
        <Arrow
            fill={"cornsilk"}
            stroke={'burlywood'}
            strokeWidth={2}
            pointerLength={5}
            pointerWidth={5}
            tension={undefined}
            closed={undefined}
            pointerAtBeginning={false}
            pointerAtEnding={true}

            x={placement.x}
            y={placement.y}
            points={placement.points}
        />
    )
}