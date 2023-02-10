import {Arrow} from "react-konva";
import {MessagePlacement} from "../sequenceDiagram/model";

export function SuggestedMessage(props: { placement: MessagePlacement }) {
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

            x={0}
            y={0}
            points={[]}
        />
    )
}
