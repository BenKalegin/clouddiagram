import React from "react";
import { IconButton, Menu } from "@mui/material";
import MenuItem from '@mui/material/MenuItem';
import AddIcon from '@mui/icons-material/Add';
import { ElementType } from "../../package/packageModel";
import { addDiagramTabAction, useDispatch } from "../diagramEditor/diagramEditorSlice";

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
                <MenuItem data-testid="add-class-diagram" onClick={() => handleClose(ElementType.ClassDiagram)}>Class Diagram</MenuItem>
                <MenuItem data-testid="add-deployment-diagram" onClick={() => handleClose(ElementType.DeploymentDiagram)}>Deployment Diagram</MenuItem>
                <MenuItem data-testid="add-flowchart-diagram" onClick={() => handleClose(ElementType.FlowchartDiagram)}>Flowchart Diagram</MenuItem>
                <MenuItem data-testid="add-sequence-diagram" onClick={() => handleClose(ElementType.SequenceDiagram)}>Sequence Diagram</MenuItem>
            </Menu>
        </div>
    );
}
