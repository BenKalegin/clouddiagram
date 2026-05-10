import { useRef } from "react";
import { useClickOutside, useEscapeKey } from "@benkalegin/ui26";
import { ContextPopupProps } from "../diagramEditor/diagramEditorModel";
import { PropertiesEditor } from "../propertiesEditor/PropertiesEditor";
import { hideContextAction, useDispatch } from "../diagramEditor/diagramEditorSlice";
import "./ContextPopup.css";

export const ContextPopup = (props: ContextPopupProps) => {
    const dispatch = useDispatch();
    const ref = useRef<HTMLDivElement>(null);
    const close = () => dispatch(hideContextAction({}));

    useEscapeKey(close);
    useClickOutside(ref, close, {
        armOnNextFrame: true,           // gear's own mousedown opens this popup
        ignoreFloatingUiPortals: true   // Menu/Popover descendants portal to body
    });

    return (
        <div
            ref={ref}
            role="dialog"
            className="context-popup"
            style={{ top: props.mousePos.y, left: props.mousePos.x }}
        >
            <PropertiesEditor />
        </div>
    );
};
