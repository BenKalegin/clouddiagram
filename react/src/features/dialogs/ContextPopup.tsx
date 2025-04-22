import {ContextPopupProps} from "../diagramEditor/diagramEditorModel";
import {PropertiesEditor} from "../propertiesEditor/PropertiesEditor";
import {useRef} from "react";

export const ContextPopup = (props: ContextPopupProps) => {
    const popupRef = useRef<HTMLDivElement>(null);

    return (
        <div
            ref={popupRef}
            style={{position: "absolute", left: props.mousePos.x - 10, top: props.mousePos.y - 16, color: "gray"}}
        >
            <PropertiesEditor/>
        </div>
    )
}
