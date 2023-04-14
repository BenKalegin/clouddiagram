import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    List,
    ListItemButton,
    ListItemIcon,
    ListItemText,
} from "@mui/material";
import React from "react";
import {useRecoilValue} from "recoil";
import {exportingAtom, ExportPhase} from "../diagramEditor/diagramEditorModel";
import {exportDiagramTabAction, useDispatch} from "../diagramEditor/diagramEditorSlice";
import {exportFormats, ExportKind} from "../export/exportFormats";


export const ExportDialog = () => {
    const exporting = useRecoilValue(exportingAtom)
    const dispatch = useDispatch();

    function toggleHideDialog(item: ExportKind | undefined) {
        dispatch(exportDiagramTabAction({exportState: item === undefined ? ExportPhase.cancel : ExportPhase.selected}));
    }

    return (
        <Dialog
            PaperProps={{ sx: { m: 0 } }}
            open={exporting !== undefined}
            onClose={() => toggleHideDialog(undefined)}
        >
            <DialogTitle>{'Exporting diagram...'}</DialogTitle>
            <DialogContent>
                <List>
                    { exportFormats.map(([kind, name], index) => (
                        <ListItemButton
                            key={index}
                            onClick={() => toggleHideDialog(kind)}
                        >
                            <ListItemIcon sx={{minWidth: 36}}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    getSvgDataById(item.icon)
                                </svg>
                            </ListItemIcon>
                            <ListItemText primary={kind}/>
                        </ListItemButton>
                    ))}
                </List>

            </DialogContent>
            <DialogActions>
                <Button onClick={() => toggleHideDialog(undefined)}>Cancel</Button>
            </DialogActions>
        </Dialog>
    )
}
