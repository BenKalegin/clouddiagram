import {
    ColorSchema,
    colorSchemaList
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
import {PropAndKind} from "./PropertiesEditor";

const ColorSchemaIcon: React.FC<ColorSchema> = (props:ColorSchema) => {
    return (
        <SvgIcon>
            <svg viewBox="0 0 100 80">
                <rect
                    rx="15"
                    ry="15"
                    y="10"
                    x="10"
                    height="60"
                    width="80"
                    fill={props.fillColor}
                    stroke={props.strokeColor}
                    strokeWidth={2}
                />
            </svg>
        </SvgIcon>
    );
}
interface ColorSchemaPropertyEditorProps{
    propAndKind: PropAndKind
    value: ColorSchema
    updateProps: (value: any) => void
}

export const LinkStylePropertyEditor: React.FC<ColorSchemaPropertyEditorProps> = (props: ColorSchemaPropertyEditorProps ) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleItemClick = (colorSchema: ColorSchema) => {
        props.updateProps(colorSchema);
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
                            <ColorSchemaIcon {...props.value} />
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
                        {colorSchemaList.map((colorSchema, i) => (
                            <MenuItem
                                key={i}
                                sx={{height: "24"}}
                                onClick={() => handleItemClick(colorSchema)}>
                                <ColorSchemaIcon {...colorSchema} />
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

