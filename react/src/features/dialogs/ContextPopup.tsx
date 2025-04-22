import {ContextPopupProps} from "../diagramEditor/diagramEditorModel";

export const ContextPopup = (props: ContextPopupProps) => {
    return (
        <div style={{position: "absolute", left: props.mousePos.x, top: props.mousePos.y, color: "gray"}}>
            Popup here
        </div>
    )
}
