import {Rect} from "react-konva";
import {Id} from "../../common/model";
import {useAppSelector} from "../../app/hooks";
import {selectSequenceDiagramEditor} from "./sequenceDiagramSlice";

export interface ActivationProps {
    activationId: Id
}

export const Activation = (props: ActivationProps) => {

    const activation = useAppSelector(state => selectSequenceDiagramEditor(state).diagram.activations[props.activationId]);
    const linkingTarget = useAppSelector(state => selectSequenceDiagramEditor(state).linking?.targetElement);
    const linkingSource = useAppSelector(state => selectSequenceDiagramEditor(state).linking?.sourceElement);
    return (
        <Rect
            fill={"cornsilk"}
            stroke={"peru"}
            strokeWidth={1}
            shadowEnabled={activation.id === linkingTarget || activation.id === linkingSource}
            shadowColor={'black'}
            shadowBlur={3}
            shadowOffset={{x: 2, y: 2}}
            shadowOpacity={0.4}
            {...activation.placement}
        >
        </Rect>
    )
}
