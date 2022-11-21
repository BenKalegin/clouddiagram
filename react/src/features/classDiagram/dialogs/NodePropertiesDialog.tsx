import {
    ContextualMenu,
    DefaultButton,
    Dialog,
    DialogFooter,
    DialogType,
    PrimaryButton,
    TextField
} from "@fluentui/react";
import {useId} from '@fluentui/react-hooks';
import {FormEvent, useCallback, useMemo, useState} from "react";
import {nodeCloseProperties, selectDiagramEditor} from "../diagramEditorSlice";
import {useAppDispatch, useAppSelector} from "../../../app/hooks";

const dialogStyles = { main: { maxWidth: 450 } };
const dragOptions = {
    moveMenuItemText: 'Move',
    closeMenuItemText: 'Close',
    menu: ContextualMenu,
    keepInBounds: true,
};
export const NodePropertiesDialog = () => {
    const isDraggable = true;
    const labelId: string = useId('dialogLabel');
    const subTextId: string = useId('subTextLabel');
    const editor = useAppSelector(state => selectDiagramEditor(state));
    const node = editor.diagram.content.nodes[editor.selectedElements[0]];
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

    const [name, setName] = useState<string | undefined>(undefined);

    function toggleHideDialog(save: boolean) {
        dispatch(nodeCloseProperties({save, node: node.id, text: name ?? ''}))
        setName('')
    }

    const onNameChange = useCallback(
        (event: FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) => {
            if (!newValue || newValue.length <= 15) {
                setName(newValue || '');
            }
        },
        [],
    );

    const coercedName = name ?? node?.text;
    return (
        <Dialog
            hidden={!editor.isNodePropsDialogOpen}
            onDismiss={() => toggleHideDialog(false)}
            dialogContentProps={{
                type: DialogType.normal,
                title: coercedName + ' properties',
                closeButtonAriaLabel: 'Close',
                subText: 'Specify the name for the node',
            }}
            modalProps={modalProps}
        >
            <TextField
                label="Name for the node"
                value={coercedName}
                onChange={onNameChange}
                // styles={textFieldStyles}
            />
            <DialogFooter>
                <PrimaryButton onClick={() => toggleHideDialog(true)} text="Save"/>
                <DefaultButton onClick={() => toggleHideDialog(false)} text="Cancel"/>
            </DialogFooter>
        </Dialog>
    )
}
