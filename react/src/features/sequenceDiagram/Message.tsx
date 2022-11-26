import {Arrow} from "react-konva";
import {MessageState} from "./model";

export interface MessageProps {
    message: MessageState
}

export const Message = ({message: {placement}}: MessageProps) => {
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

            x={placement.x}
            y={placement.y}
            points={placement.points}
        />
    )
}
