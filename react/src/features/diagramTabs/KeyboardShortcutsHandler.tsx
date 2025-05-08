import { useHotkeys } from "react-hotkeys-hook";
import { useRecoilValue } from "recoil";
import { selectedRefsSelector } from "../diagramEditor/diagramEditorModel";
import { elementCommandAction, useDispatch } from "../diagramEditor/diagramEditorSlice";
import { Command } from "../propertiesEditor/propertiesEditorModel";
import { DiagramId } from "../diagramEditor/diagramEditorModel";

interface KeyboardShortcutsHandlerProps {
    activeDiagramId: DiagramId;
}

export const useKeyboardShortcuts = ({ activeDiagramId }: KeyboardShortcutsHandlerProps) => {
    const dispatch = useDispatch();
    const selectedElements = useRecoilValue(selectedRefsSelector(activeDiagramId));

    useHotkeys('delete, backspace, left, right, up, down', (event) => {
        event.preventDefault();

        let command;
        switch (event.key) {
            case 'Delete':
            case 'Backspace':
                command = Command.Delete;
                break;
            case 'ArrowLeft':
                command = Command.SelectNextLeft;
                break;
            case 'ArrowRight':
                command = Command.SelectNextRight;
                break;
            case 'ArrowUp':
                command = Command.SelectNextUp;
                break;
            case 'ArrowDown':
                command = Command.SelectNextDown;
                break;
            default:
                return;
        }

        dispatch(elementCommandAction({
            command,
            elements: selectedElements
        }));
    });

    // No need to return anything as this hook just sets up the keyboard shortcuts
    return null;
};