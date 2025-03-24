import {
    TipStyle
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
import {enumKeys} from "../../common/EnumUtils";

const TipStyleIcon: React.FC<{ tipStyle: TipStyle }> = ({ tipStyle }) => {
    let path;

    switch (tipStyle) {
        case TipStyle.Arrow:
            path = <path d="M10,40 L80,40 L60,25 M80,40 L60,55" stroke="currentColor" fill="none" strokeWidth="4" />;
            break;
        case TipStyle.Triangle:
            path = <path d="M10,40 L60,40 L60,25 L80,40 L60,55 L60,40 L10,40 Z" stroke="currentColor" fill="none" strokeWidth="4" />;
            break;
        case TipStyle.Diamond:
            path = <path d="M10,40 L40,40 L60,25 L80,40 L60,55 L40,40 L10,40 Z" stroke="currentColor" fill="none" strokeWidth="4" />;
            break;
        case TipStyle.Circle:
            path = <circle cx="80" cy="40" r="10" stroke="currentColor" fill="none" strokeWidth="4" />;
            break;
        case TipStyle.Square:
            path = <rect x="70" y="30" width="20" height="20" stroke="currentColor" fill="none" strokeWidth="4" />;
            break;

        case TipStyle.None:
            path = <path d="M10,40 L80,40" stroke="currentColor" fill="none" strokeWidth="4" />;
            break;

    }

    return (
        <SvgIcon>
            <svg viewBox="0 0 100 80">
                {path}
            </svg>
        </SvgIcon>
    );
}
interface TipStylePropertyEditorProps{
    propAndKind: PropAndKind
    value: TipStyle
    updateProps: (value: any) => void
}

export const TipStylePropertyEditor: React.FC<TipStylePropertyEditorProps> = (props: TipStylePropertyEditorProps ) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleItemClick = (style: TipStyle) => {
        props.updateProps(style);
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
                            <TipStyleIcon tipStyle={props.value} />
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
                        {enumKeys(TipStyle).map((styleKey) => (
                            <MenuItem
                                key={styleKey}
                                sx={{height: "40px"}}
                                onClick={() => handleItemClick(TipStyle[styleKey])}>
                                <TipStyleIcon tipStyle={TipStyle[styleKey]} />
                                <span style={{marginLeft: 10}}>{styleKey}</span>
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

