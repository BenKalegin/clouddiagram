import {
    LineStyle, lineStyleList,
} from "../../package/packageModel";
import React, {useState} from "react";
import {
    ButtonGroup,
    FormControlLabel,
    IconButton, Menu,
    SvgIcon
} from "@mui/material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import MenuItem from "@mui/material/MenuItem";
import {PropAndKind} from "./propertiesEditorModel";

const LineStyleIcon: React.FC<LineStyle> = (props:LineStyle) => {
    return (
        <SvgIcon>
            <svg viewBox="0 0 100 80">
                <line
                    x1="10"
                    y1="40"
                    x2="90"
                    y2="40"
                    stroke={props.strokeColor}
                    strokeWidth={2}
                />
            </svg>
        </SvgIcon>
    );
}
interface LineStylePropertyEditorProps{
    propAndKind: PropAndKind
    value: LineStyle
    updateProps: (value: any) => void
}

export const LineStylePropertyEditor: React.FC<LineStylePropertyEditorProps> = (props: LineStylePropertyEditorProps ) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleItemClick = (lineStyle: LineStyle) => {
        props.updateProps(lineStyle);
        handleClose();
    };

    const handleOpenMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const popupOpen = Boolean(anchorEl);
    return (
            <FormControlLabel control={
                <>
                    <ButtonGroup variant="text" aria-label="split button">
                        <IconButton
                            aria-label="change color"
                            sx={{
                                borderRadius: "10%"
                            }}
                            onClick={handleOpenMenu}
                        >
                            <LineStyleIcon {...props.value} />
                            <ArrowDropDownIcon/>
                        </IconButton>
                    </ButtonGroup>
                    <Menu
                        onClose={handleClose}
                        anchorEl={anchorEl}
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                        open={popupOpen}
                    >
                        {lineStyleList.map((lineStyle, i) => (
                            <MenuItem
                                key={i}
                                sx={{height: "24"}}
                                onClick={() => handleItemClick(lineStyle)}>
                                <LineStyleIcon {...lineStyle} />
                            </MenuItem>
                            ))
                        }
                    </Menu>
                </>
            }
             label={props.propAndKind.prop.label}
            />

    );
}
