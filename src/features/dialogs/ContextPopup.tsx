import {ContextPopupProps} from "../diagramEditor/diagramEditorModel";
import {PropertiesEditor} from "../propertiesEditor/PropertiesEditor";
import {Popover} from "@mui/material";
import {hideContextAction, useDispatch} from "../diagramEditor/diagramEditorSlice";

export const ContextPopup = (props: ContextPopupProps) => {
    const dispatch = useDispatch()

    // Using the mouse position as the anchor point
    return (
        <Popover
            open={true}
            anchorReference="anchorPosition"
            anchorPosition={{
                left: props.mousePos.x,
                top: props.mousePos.y
            }}
            transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
            }}
            onClose={(event) => {
                dispatch(hideContextAction({}))
            }}
        >
            <PropertiesEditor/>
        </Popover>
    )
}
