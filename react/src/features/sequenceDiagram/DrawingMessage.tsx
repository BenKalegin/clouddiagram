import {zeroBounds} from "../../common/Model";
import {useAppSelector} from "../../app/hooks";
import {selectSequenceDiagramEditor} from "../classDiagram/diagramEditorSlice";
import {Arrow} from "react-konva";
import {
    activationPlacement,
    ActivationState,
    LifelinePlacement,
    messagePlacement
} from "./model";

export const DrawingMessage = (props: { lifelinePlacement: LifelinePlacement }) => {

    const linking = useAppSelector(state => selectSequenceDiagramEditor(state).linking)!;
    const sourceLifeline = useAppSelector(state => selectSequenceDiagramEditor(state).diagram.lifelines[linking.sourceElement]);
    const activations = useAppSelector(state => selectSequenceDiagramEditor(state).diagram.activations);

    const y = linking.diagramPos.y;
    const lifelineY = Math.max(y - props.lifelinePlacement.headBounds.height, 0)

    let sourceActivation = sourceLifeline.activations.map(id => activations[id])
        .find(a => a.start <= lifelineY && a.start + a.length >= lifelineY);
    if (!sourceActivation) {
        sourceActivation = {start: lifelineY, length: 50, id: "dummy"} as ActivationState;
        sourceActivation.placement = activationPlacement(sourceActivation, sourceLifeline.placement);
    }

    const targetActivation: ActivationState = {
        id: "linking_target",
        start: y,
        length: 20,
        placement: zeroBounds
    };

    const targetLifelinePlacement: LifelinePlacement = {
        headBounds: {
            x: linking!.diagramPos.x - props.lifelinePlacement.headBounds.width / 2,
            y: props.lifelinePlacement.headBounds.y,
            width: props.lifelinePlacement.headBounds.width,
            height: props.lifelinePlacement.headBounds.height
        },
        lifelineEnd: props.lifelinePlacement.lifelineEnd
    }

    targetActivation.placement = activationPlacement(targetActivation, targetLifelinePlacement) ;
    let messageActivationOffset = y - sourceActivation.placement.y;
    const placement = messagePlacement(sourceActivation, targetActivation, messageActivationOffset);
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
