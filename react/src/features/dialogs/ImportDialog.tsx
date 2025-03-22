import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Grid,
    List,
    ListItemButton,
    ListItemText,
} from "@mui/material";
import React from "react";
import {useRecoilValue} from "recoil";
import {importingAtom, ImportPhase} from "../diagramEditor/diagramEditorModel";
import {importDiagramTabAction, useDispatch} from "../diagramEditor/diagramEditorSlice";
import {ExportImportFormat, importFormats} from "../export/exportFormats";
import {CodeMemo} from "../commonControls/CodeMemo";
import {ElementType} from "../../package/packageModel";

export const ImportDialog = ({diagramKind}: {diagramKind: ElementType}) => {
    const importing = useRecoilValue(importingAtom)
    const dispatch = useDispatch();
    const [importedCode, setImportedCode] = React.useState("");

    function toggleHideDialog(importState: ImportPhase, format?: ExportImportFormat) {
        dispatch(importDiagramTabAction({importState, format, importedCode}));
    }

    return (
        <Dialog
            PaperProps={{ sx: { m: 0 }, style: { minWidth: '600px'}}}
            open={importing !== undefined}
            onClose={() => toggleHideDialog(ImportPhase.cancel, undefined)}
        >
            <DialogTitle>{'Importing diagram...'}</DialogTitle>
            <DialogContent>
                <Grid container spacing={2} style={{ display: 'flex', flexWrap: 'nowrap' }}>
                        <Grid item xs={4}>
                            <List>
                                { importFormats(diagramKind).map(([kind, name], index) => (
                                    <ListItemButton
                                        key={index}
                                        onClick={() => toggleHideDialog(ImportPhase.selected, kind)}
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
                                value={importedCode}
                                onChange={(event) => setImportedCode(event.target.value)}
                                minRows={20}
                            />
                        </Grid>
                    </Grid>
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={() => toggleHideDialog(ImportPhase.importing, importing?.format)}
                    disabled={!importedCode.trim() || !importing?.format}
                >
                    Import
                </Button>
                <Button onClick={() => toggleHideDialog(ImportPhase.cancel, undefined)}>Cancel</Button>
            </DialogActions>
        </Dialog>
    )
}
