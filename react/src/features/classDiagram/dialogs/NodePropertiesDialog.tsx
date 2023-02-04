import {FormEvent, useCallback, useState} from "react";
import {Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField} from "@mui/material";
import {useRecoilValue} from "recoil";
import {elementsAtom, selectedElementsAtom} from "../../diagramEditor/diagramEditorModel";
import {NodeState} from "../../../package/packageModel";

export const NodePropertiesDialog = () => {

    const selectedId = useRecoilValue(selectedElementsAtom)[0];
    const node = useRecoilValue(elementsAtom(selectedId)) as NodeState

    const [name, setName] = useState<string | undefined>(undefined);

    function toggleHideDialog(save: boolean) {
        //dispatch(nodeCloseProperties({save, node: node.id, text: name ?? ''}))
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
            open = {false} //  {!!editor.isNodePropsDialogOpen}
            onClose={() => toggleHideDialog(false)}
        >
            <DialogTitle>{coercedName + ' properties'}</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Specify the name for the node
                </DialogContentText>

                <TextField
                    label="Name for the node"
                    value={coercedName}
                    onChange={onNameChange}
                    // styles={textFieldStyles}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={() => toggleHideDialog(true)}>Save</Button>
                <Button onClick={() => toggleHideDialog(false)}>Cancel</Button>
            </DialogActions>
        </Dialog>
    )
}
