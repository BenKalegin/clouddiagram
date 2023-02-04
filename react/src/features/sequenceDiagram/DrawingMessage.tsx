import {zeroBounds} from "../../common/model";
import {Arrow} from "react-konva";
import {
    ActivationState,
    LifelineId,
    LifelinePlacement, lifelinePlacementSelector,
    lifelineSelector,
    messagePlacement,
    placeActivation
} from "./model";
import {useRecoilValue} from "recoil";
import {linkingAtom} from "../diagramEditor/diagramEditorModel";
import {DiagramId} from "../classDiagram/model";
import {ElementType} from "../../package/packageModel";
import {FC} from "react";

export interface DrawingMessageProps {
    lifelineId: LifelineId
    diagramId: DiagramId
}

export const DrawingMessage: FC<DrawingMessageProps> = ({lifelineId, diagramId}) => {

    const linking = useRecoilValue(linkingAtom)
    const lifelinePlacement = useRecoilValue(lifelinePlacementSelector({lifelineId, diagramId}))
    const sourceLifeline = useRecoilValue(lifelineSelector({lifelineId: linking.sourceElement, diagramId}))

    const y = linking.diagramPos.y;
    const lifelineY = Math.max(y - lifelinePlacement.headBounds.height, 0)

    let sourceActivation = sourceLifeline.activations
        .find(a => a.start <= lifelineY && a.start + a.length >= lifelineY);
    if (!sourceActivation) {
        sourceActivation = {start: lifelineY, length: 50, id: "dummy"} as ActivationState;
        sourceActivation.placement = placeActivation(sourceActivation, sourceLifeline.placement);
    }

    const targetActivation: ActivationState = {
        type: ElementType.SequenceActivation,
        id: "linking_target",
        start: y,
        length: 20,
        placement: zeroBounds
    };

    const targetLifelinePlacement: LifelinePlacement = {
        headBounds: {
            x: linking!.diagramPos.x - lifelinePlacement.headBounds.width / 2,
            y: lifelinePlacement.headBounds.y,
            width: lifelinePlacement.headBounds.width,
            height: lifelinePlacement.headBounds.height
        },
        lifelineEnd: lifelinePlacement.lifelineEnd
    }

    targetActivation.placement = placeActivation(targetActivation, targetLifelinePlacement) ;
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
