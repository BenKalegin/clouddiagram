import {Rect} from "react-konva";
import {useRecoilValue} from "recoil";
import {ActivationId, activationRenderSelector} from "./sequenceDiagramModel";
import {DiagramId, linkingAtom} from "../diagramEditor/diagramEditorModel";
import {ColorSchema} from "../../package/packageModel";

export interface ActivationProps {
    activationId: ActivationId
    diagramId: DiagramId
    shapeStyle: ColorSchema
}

export const Activation = ({activationId, diagramId, shapeStyle}: ActivationProps) => {

    const render = useRecoilValue(activationRenderSelector({activationId, diagramId}))
    const linking = useRecoilValue(linkingAtom)
    const linkingTarget = linking?.targetElement;
    const linkingSource = linking?.sourceElement;
    return (
        <Rect
            fill={shapeStyle.fillColor}
            stroke={shapeStyle.strokeColor}
            strokeWidth={1}
            shadowEnabled={activationId === linkingTarget?.id || activationId === linkingSource}
            shadowColor={'black'}
            shadowBlur={3}
            shadowOffset={{x: 2, y: 2}}
            shadowOpacity={0.4}
            {...render.bounds}
        >
        </Rect>
    )
}
