import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle, Grid,
    List,
    ListItemButton,
    ListItemText,
} from "@mui/material";
import React from "react";
import {useRecoilValue} from "recoil";
import {exportingAtom, ExportPhase} from "../diagramEditor/diagramEditorModel";
import {exportDiagramTabAction, useDispatch} from "../diagramEditor/diagramEditorSlice";
import {exportFormats, ExportKind} from "../export/exportFormats";
import {CodeMemo} from "../commonControls/CodeMemo";
import {ElementType} from "../../package/packageModel";

export const ExportDialog = ({diagramKind}: {diagramKind: ElementType}) => {
    const exporting = useRecoilValue(exportingAtom)
    const dispatch = useDispatch();

    function toggleHideDialog(item: ExportKind | undefined) {
        dispatch(exportDiagramTabAction({exportState: item === undefined ? ExportPhase.cancel : ExportPhase.selected, kind: item}));
    }

    return (
        <Dialog
            PaperProps={{ sx: { m: 0 }, style: { minWidth: '600px'}}}
            open={exporting !== undefined}
            onClose={() => toggleHideDialog(undefined)}
        >
            <DialogTitle>{'Exporting diagram...'}</DialogTitle>
            <DialogContent>
                <Grid container spacing={2} style={{ display: 'flex', flexWrap: 'nowrap' }}>
                        <Grid item xs={4}>
                            <List>
                                { exportFormats(diagramKind).map(([kind, name], index) => (
                                    <ListItemButton
                                        key={index}
                                        onClick={() => toggleHideDialog(kind)}
                                    >
                                        <ListItemText primary={name}/>
                                    </ListItemButton>
                                ))}
                            </List>
                        </Grid>
                        <Grid item xs={8}>
                            <CodeMemo
                                label="Exported code"
                                placeholder="Exported code"
                                value={exporting?.code}
                                //readOnly={true}
                                minRows={20}
                            />
                        </Grid>
                    </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => toggleHideDialog(undefined)}>Cancel</Button>
            </DialogActions>
        </Dialog>
    )
}
