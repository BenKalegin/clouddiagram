import {Rect} from "react-konva";
import {useRecoilValue} from "recoil";
import {ActivationId, activationPlacementSelector, LifelineId} from "./model";
import {linkingAtom} from "../diagramEditor/diagramEditorModel";
import {DiagramId} from "../classDiagram/model";

export interface ActivationProps {
    activationId: ActivationId
    lifelineId: LifelineId
    diagramId: DiagramId
}

export const Activation = ({activationId, lifelineId, diagramId}: ActivationProps) => {

    const placement = useRecoilValue(activationPlacementSelector({activationId, lifelineId, diagramId}))
    const linking = useRecoilValue(linkingAtom)
    const linkingTarget = linking?.targetElement;
    const linkingSource = linking?.sourceElement;
    return (
        <Rect
            fill={"cornsilk"}
            stroke={"peru"}
            strokeWidth={1}
            shadowEnabled={activationId === linkingTarget || activationId === linkingSource}
            shadowColor={'black'}
            shadowBlur={3}
            shadowOffset={{x: 2, y: 2}}
            shadowOpacity={0.4}
            {...placement}
        >
        </Rect>
    )
}
