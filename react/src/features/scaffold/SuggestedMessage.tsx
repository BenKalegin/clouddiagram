import {Arrow} from "react-konva";
import {MessagePlacement} from "../sequenceDiagram/model";

export function SuggestedMessage(props: { placement: MessagePlacement }) {
    const {points, y, x} = props.placement;
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

            x={x}
            y={y}
            points={points}
        />
    )
}
