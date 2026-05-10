import React from "react";
import { IconButton, Menu } from "@mui/material";
import MenuItem from '@mui/material/MenuItem';
import AddIcon from '@mui/icons-material/Add';
import { ElementType } from "../../package/packageModel";
import { addDiagramTabAction, useDispatch } from "../diagramEditor/diagramEditorSlice";
import {diagramTypeDefinitions} from "../diagramTypes/diagramTypeRegistry";

export function AddNewTabButton() {
    const dispatch = useDispatch()
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = (diagramKind: ElementType) => {
        setAnchorEl(null);
        dispatch(addDiagramTabAction({diagramKind}));
    };

    return (
        <div style={{lineHeight: "3em"}}>
            <IconButton
                data-testid="add-diagram-button"
                onClick={handleClick}
                size="small"
            >
                <AddIcon fontSize="inherit" />
            </IconButton>
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
            >
                {diagramTypeDefinitions.map(definition => (
                    <MenuItem
                        key={definition.type}
                        data-testid={definition.testId}
                        onClick={() => handleClose(definition.type)}
                    >
                        {definition.title}
                    </MenuItem>
                ))}
            </Menu>
        </div>
    );
}
