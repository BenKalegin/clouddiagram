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
    useClickOutside(ref, close);

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
