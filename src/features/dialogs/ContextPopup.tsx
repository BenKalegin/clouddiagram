import { useEffect, useRef, useState } from "react";
import { useEscapeKey } from "@benkalegin/ui26";
import { ContextPopupProps } from "../diagramEditor/diagramEditorModel";
import { PropertiesEditor } from "../propertiesEditor/PropertiesEditor";
import { hideContextAction, useDispatch } from "../diagramEditor/diagramEditorSlice";
import "./ContextPopup.css";

export const ContextPopup = (props: ContextPopupProps) => {
    const dispatch = useDispatch();
    const ref = useRef<HTMLDivElement>(null);
    const close = () => dispatch(hideContextAction({}));

    // Arm the click-outside listener on the next frame so the gear's own
    // mousedown (which opened this popup) doesn't immediately close it.
    const [armed, setArmed] = useState(false);
    useEffect(() => {
        const id = requestAnimationFrame(() => setArmed(true));
        return () => cancelAnimationFrame(id);
    }, []);

    useEscapeKey(close);

    // Custom click-outside that also ignores clicks inside floating-ui-rendered
    // descendants (Menu/Popover content portaled to body but logically inside this popup).
    useEffect(() => {
        if (!armed) return;
        const handler = (e: MouseEvent) => {
            const target = e.target as Element | null;
            if (!target) return;
            if (ref.current?.contains(target)) return;
            if (target.closest("[data-floating-ui-focusable]")) return;
            close();
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [armed]);

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
