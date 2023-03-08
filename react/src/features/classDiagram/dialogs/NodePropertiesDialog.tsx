import {Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField} from "@mui/material";
import {useRecoilState, useRecoilValue} from "recoil";
import {selectedElementsAtom} from "../../diagramEditor/diagramEditorModel";
import {DialogOperation, propertiesDialogAction, useDispatch} from "../../diagramEditor/diagramEditorSlice";
import {nodeSelector} from "../classDiagramModel";

export const NodePropertiesDialog = () => {

    const selectedId = useRecoilValue(selectedElementsAtom)[0];
    const [node, setNode] = useRecoilState(nodeSelector(selectedId.id));
    const dispatch = useDispatch()

    function close(save: boolean) {

        dispatch(propertiesDialogAction({
            elementId: selectedId.id, dialogResult: save ? DialogOperation.save: DialogOperation.cancel}))
    }

    return (
        <Dialog
            open = {true} //  {!!editor.isNodePropsDialogOpen}
            onClose={() => close(false)}
        >
            <DialogTitle>{node.text  + ' properties'}</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Specify the name for the node
                </DialogContentText>

                <TextField
                    label="Name for the node"
                    value={node.text}
                    onChange={ event => setNode({...node, text: event.target.value || ''})}
                    // styles={textFieldStyles}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={() => close(true)}>Save</Button>
                <Button onClick={() => close(false)}>Cancel</Button>
            </DialogActions>
        </Dialog>
    )
}
