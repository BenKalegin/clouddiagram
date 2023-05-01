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
import {
    elementsAtom,
    importingAtom,
    ImportPhase
} from "../diagramEditor/diagramEditorModel";
import {importDiagramTabAction, useDispatch} from "../diagramEditor/diagramEditorSlice";
import {ExportImportFormat, importFormats} from "../export/exportFormats";
import {CodeMemo} from "../commonControls/CodeMemo";
import {ElementType} from "../../package/packageModel";
import {activeDiagramIdAtom} from "../diagramTabs/DiagramTabs";
import {Diagram} from "../../common/model";

export const ImportDialog = ({diagramKind}: {diagramKind: ElementType}) => {
    const importing = useRecoilValue(importingAtom)
    const dispatch = useDispatch();
    const activeDiagramId = useRecoilValue(activeDiagramIdAtom);
    const diagram = useRecoilValue(elementsAtom(activeDiagramId)) as Diagram;

    function toggleHideDialog(format: ExportImportFormat | undefined) {
        dispatch(importDiagramTabAction({importState: format === undefined ? ImportPhase.cancel : ImportPhase.selected, format}));
    }

    return (
        <Dialog
            PaperProps={{ sx: { m: 0 }, style: { minWidth: '600px'}}}
            open={importing !== undefined}
            onClose={() => toggleHideDialog(undefined)}
        >
            <DialogTitle>{'Importing diagram...'}</DialogTitle>
            <DialogContent>
                <Grid container spacing={2} style={{ display: 'flex', flexWrap: 'nowrap' }}>
                        <Grid item xs={4}>
                            <List>
                                { importFormats(diagramKind).map(([kind, name], index) => (
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
                            <p/>
                            <CodeMemo
                                label="Imported code"
                                placeholder="Copy and paste diagram code here"
                                value={ "" }
                                //readOnly={true}
                                minRows={20}
                            />
                        </Grid>
                    </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => toggleHideDialog(undefined)}>Import</Button>
                <Button onClick={() => toggleHideDialog(undefined)}>Cancel</Button>
            </DialogActions>
        </Dialog>
    )
}
