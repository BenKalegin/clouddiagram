import { useCallback, useMemo } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useAtomValue } from "jotai";
import { selectedRefsSelector, diagramKindSelector, DiagramId } from "../diagramEditor/diagramEditorModel";
import { elementCommandAction, useDispatch, diagramEditors } from "../diagramEditor/diagramEditorSlice";

interface KeyboardShortcutsHandlerProps {
    activeDiagramId: DiagramId;
}

export const useKeyboardShortcuts = ({ activeDiagramId }: KeyboardShortcutsHandlerProps) => {
    const dispatch = useDispatch();
    const selectedElements = useAtomValue(selectedRefsSelector(activeDiagramId));
    const diagramKind = useAtomValue(diagramKindSelector(activeDiagramId));
    const bindings = useMemo(
        () => diagramEditors[diagramKind]?.getKeyBindings() ?? {},
        [diagramKind]
    );

    const fire = useCallback((event: KeyboardEvent) => {
        const command = bindings[event.key];
        if (!command) return;
        event.preventDefault();
        dispatch(elementCommandAction({ command, elements: selectedElements }));
    }, [bindings, selectedElements, dispatch]);

    useHotkeys('delete, backspace, left, right, up, down', fire, [fire]);
    useHotkeys('tab, enter', fire, { enableOnFormTags: false }, [fire]);

    return null;
};
