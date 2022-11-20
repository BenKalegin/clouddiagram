import {
    ContextualMenu,
    DefaultButton,
    Dialog,
    DialogFooter, DialogType,
    hiddenContentStyle,
    mergeStyles,
    PrimaryButton
} from "@fluentui/react";
import { useId, useBoolean } from '@fluentui/react-hooks';
import {useMemo} from "react";
import {nodeCloseProperties, selectDiagramEditor} from "../diagramEditorSlice";
import {useAppDispatch, useAppSelector} from "../../../app/hooks";

const dialogStyles = { main: { maxWidth: 450 } };
const dragOptions = {
    moveMenuItemText: 'Move',
    closeMenuItemText: 'Close',
    menu: ContextualMenu,
    keepInBounds: true,
};
const screenReaderOnly = mergeStyles(hiddenContentStyle);
const dialogContentProps = {
    type: DialogType.normal,
    title: 'Missing Subject',
    closeButtonAriaLabel: 'Close',
    subText: 'Do you want to send this message without a subject?',
};

export const NodePropertiesDialog = () => {
    const [isDraggable, { toggle: toggleIsDraggable }] = useBoolean(false);
    const labelId: string = useId('dialogLabel');
    const subTextId: string = useId('subTextLabel');
    const diagram = useAppSelector(state => selectDiagramEditor(state));
    const dispatch = useAppDispatch()

    const modalProps = useMemo(
        () => ({
            titleAriaId: labelId,
            subtitleAriaId: subTextId,
            isBlocking: false,
            styles: dialogStyles,
            dragOptions: isDraggable ? dragOptions : undefined,
        }),
        [isDraggable, labelId, subTextId],
    );

    function toggleHideDialog() { dispatch(nodeCloseProperties(true))};
    return (
        <Dialog
            hidden={!diagram.isNodePropsDialogOpen}
            onDismiss={toggleHideDialog}
            dialogContentProps={dialogContentProps}
            modalProps={modalProps}
        >
            <DialogFooter>
                <PrimaryButton onClick={toggleHideDialog} text="Save"/>
                <DefaultButton onClick={toggleHideDialog} text="Cancel"/>
            </DialogFooter>
        </Dialog>
    )
}