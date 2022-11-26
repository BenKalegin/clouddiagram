import {Rect} from "react-konva";
import {Id} from "../../common/Model";
import {useAppSelector} from "../../app/hooks";
import {selectSequenceDiagramEditor} from "../classDiagram/diagramEditorSlice";

export interface ActivationProps {
    activationId: Id
}

export const Activation = (props: ActivationProps) => {

    const activation = useAppSelector(state => selectSequenceDiagramEditor(state).diagram.activations[props.activationId]);
    return (
        <Rect
            fill={"cornsilk"}
            stroke={"peru"}
            strokeWidth={1}
            {...activation.placement}
        >
        </Rect>
    )
}
