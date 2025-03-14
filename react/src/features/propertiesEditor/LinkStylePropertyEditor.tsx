import {
    ConnectionStyle
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

const LinkStyleIcon: React.FC<{ linkStyle: ConnectionStyle }> = ({ linkStyle }) => {
    let path;

    switch (linkStyle) {
        case ConnectionStyle.Direct:
            path = <path d="M10 40 L90 40 M80 30 L90 40 L80 50" stroke="currentColor" fill="none" strokeWidth="4" />;
            break;
        case ConnectionStyle.AutoRouting:
            path = <path d="M10 40 L50 40 L50 20 L90 20 M80 10 L90 20 L80 30" stroke="currentColor" fill="none" strokeWidth="4" />;
            break;
        case ConnectionStyle.CustomLine:
            path = <path d="M10 40 L30 20 L70 60 L90 40 M80 30 L90 40 L80 50" stroke="currentColor" fill="none" strokeWidth="4" />;
            break;
        case ConnectionStyle.Bezier:
            path = <path d="M10 40 Q50 10, 90 40 M80 30 L90 40 L80 50" stroke="currentColor" fill="none" strokeWidth="4" />;
            break;
        case ConnectionStyle.OrthogonalSquare:
            path = <path d="M10 40 L50 40 L50 20 L90 20 M80 10 L90 20 L80 30" stroke="currentColor" fill="none" strokeWidth="4" strokeLinejoin="miter" />;
            break;
        case ConnectionStyle.OrthogonalRounded:
            path = <path d="M10 40 L50 40 L50 20 L90 20 M80 10 L90 20 L80 30" stroke="currentColor" fill="none" strokeWidth="4" strokeLinejoin="round" />;
            break;
        default:
            path = <path d="M10 40 L90 40 M80 30 L90 40 L80 50" stroke="currentColor" fill="none" strokeWidth="4" />;
    }

    return (
        <SvgIcon>
            <svg viewBox="0 0 100 80">
                {path}
            </svg>
        </SvgIcon>
    );
}
interface LinkStylePropertyEditorProps{
    propAndKind: PropAndKind
    value: ConnectionStyle
    updateProps: (value: any) => void
}

export const LinkStylePropertyEditor: React.FC<LinkStylePropertyEditorProps> = (props: LinkStylePropertyEditorProps ) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleItemClick = (style: ConnectionStyle) => {
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
                            <LinkStyleIcon linkStyle={props.value} />
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
                        {enumKeys(ConnectionStyle).map((styleKey) => (
                            <MenuItem
                                key={styleKey}
                                sx={{height: "40px"}}
                                onClick={() => handleItemClick(ConnectionStyle[styleKey])}>
                                <LinkStyleIcon linkStyle={ConnectionStyle[styleKey]} />
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

