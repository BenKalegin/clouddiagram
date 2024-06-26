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
import {elementsAtom, exportingAtom, ExportPhase} from "../diagramEditor/diagramEditorModel";
import {exportDiagramTabAction, useDispatch} from "../diagramEditor/diagramEditorSlice";
import {exportDiagramAs, exportFormats, ExportImportFormat} from "../export/exportFormats";
import {CodeMemo} from "../commonControls/CodeMemo";
import {ElementType} from "../../package/packageModel";
import Konva from "konva";
import {activeDiagramIdAtom} from "../diagramTabs/DiagramTabs";
import {Diagram} from "../../common/model";

export const ExportDialog = ({diagramKind, getStage}: {diagramKind: ElementType, getStage: () => Konva.Stage | null}) => {
    const exporting = useRecoilValue(exportingAtom)
    const dispatch = useDispatch();
    const activeDiagramId = useRecoilValue(activeDiagramIdAtom);
    const diagram = useRecoilValue(elementsAtom(activeDiagramId)) as Diagram;

    function toggleHideDialog(item: ExportImportFormat | undefined) {
        dispatch(exportDiagramTabAction({exportState: item === undefined ? ExportPhase.cancel : ExportPhase.selected, format: item}));
    }

    const stage = getStage()

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
                                value={ stage && exporting?.format ? exportDiagramAs(diagram, exporting.format, stage ) : "" }
                                //readOnly={true}
                                minRows={20}
                            />
                        </Grid>
                    </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => toggleHideDialog(undefined)}>Close</Button>
            </DialogActions>
        </Dialog>
    )
}
