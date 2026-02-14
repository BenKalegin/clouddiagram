import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    List, ListItemButton, ListItemIcon, ListItemText,
} from "@mui/material";
import React from "react";
import {galleryGroups, GalleryItem} from "../toolbox/models";
import {useRecoilValue} from "recoil";
import {diagramKindSelector, linkingAtom} from "../diagramEditor/diagramEditorModel";
import {linkToNewDialogCompletedAction, useDispatch} from "../diagramEditor/diagramEditorSlice";
import {activeDiagramIdAtom} from "../diagramTabs/diagramTabsModel";
import {ElementType} from "../../package/packageModel";


export const LinkToNewDialog = () => {
    const linking = useRecoilValue(linkingAtom)
    const source = linking?.sourceElement;
    const activeDiagramId = useRecoilValue(activeDiagramIdAtom);
    const diagramKind = useRecoilValue(diagramKindSelector(activeDiagramId));
    const groupKeys = diagramKind === ElementType.FlowchartDiagram ? ["flowchart", "c4"] : ["class"];
    const items = galleryGroups.filter(group => groupKeys.includes(group.key)).flatMap(group => group.items);
    const dispatch = useDispatch();

    function toggleHideDialog(item?: GalleryItem) {
        dispatch(linkToNewDialogCompletedAction({selectedKey: item?.key, selectedName: item?.name, success: !!item}));
    }

    const pos = {
        x: Math.max(linking?.mousePos?.x || 0, 0),
        y: Math.max(linking?.mousePos?.y || 0, 0),
    }

    return (
        <Dialog
            PaperProps={{ sx: { position: "fixed", top: pos.y, left: pos.x, m: 0 } }}
            open={linking?.showLinkToNewDialog === true}
            onClose={() => toggleHideDialog(undefined)}
        >
            <DialogTitle>{'Linking ' + source + ' to new...'}</DialogTitle>
            <DialogContent>
                <List>
                    {items.map(item => (
                        <ListItemButton
                            key={item.key}
                            onClick={() => toggleHideDialog(item)}
                        >
                            <ListItemIcon sx={{minWidth: 36}}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    getSvgDataById(item.icon)
                                </svg>
                            </ListItemIcon>
                            <ListItemText primary={item.name}/>
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
