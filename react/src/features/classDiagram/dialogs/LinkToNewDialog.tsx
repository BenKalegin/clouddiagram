import {linkToNewDialogClose, selectClassDiagramEditor} from "../diagramEditorSlice";
import {useAppDispatch, useAppSelector} from "../../../app/hooks";
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    List, ListItemButton, ListItemIcon, ListItemText, SvgIcon,
} from "@mui/material";
import React from "react";
import {galleryGroups, GalleryItem} from "../../componentLibrary/models";

export const LinkToNewDialog = () => {
    const linking = useAppSelector(state => selectClassDiagramEditor(state).linking);
    const source = linking?.sourceElement;
    const dispatch = useAppDispatch()
    const items = galleryGroups.filter(group => group.key === "class").flatMap(group => group.items);

    function toggleHideDialog(item?: GalleryItem) {
        dispatch(linkToNewDialogClose({selectedKey: item?.key, selectedName: item?.name, success: !!item}));
    }

    return (
        <Dialog
            open={linking?.showLinkToNewDialog === true}
            onClose={() => toggleHideDialog(undefined)}
        >
            <DialogTitle>{'Linking ' + source + ' to:'}</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Specify the node to create link to.
                </DialogContentText>
                <List>
                    {items.map(item => (
                        <ListItemButton
                            key={item.key}
                            onClick={() => toggleHideDialog(item)}
                        >
                            <ListItemIcon sx={{minWidth: 36}}>
                                <SvgIcon component={item.icon} fontSize="small" />
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
