import {
    CustomShape,
    PictureLayout
} from "../../package/packageModel";
import React, {useContext, useState} from "react";
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
import {AppLayoutContext} from "../../app/appModel";

const NodeLayoutIcon: React.FC<{ layout: PictureLayout }> = ({ layout }) => {
    let svgContent;

    const { appLayout } = useContext(AppLayoutContext);
    const isDarkMode = appLayout.darkMode;


    switch (layout) {
        case PictureLayout.NoIconRect:
            svgContent =
                <>
                    <rect height="100%" width="100%" fill={"none"} stroke={isDarkMode ? "white" : "black"} strokeWidth={2}/>
                    <text x="50%" y="50%" textAnchor="middle" fill={isDarkMode ? "white" : "black"}>Caption</text>
                </>
            break;
        case PictureLayout.TopLeftCorner:
            svgContent = (
                <>
                    <rect height="100%" width="100%" fill={"none"} stroke={isDarkMode ? "white" : "black"} strokeWidth={2}/>
                    <rect width="25%" height="30%" fill={isDarkMode ? "white" : "black"}/>
                    <circle cx="12%" cy="13%" r="9%" fill={isDarkMode ? "black" : "white"}/>
                    <text x="35%" y="15%" textAnchor="left" fill={isDarkMode ? "white" : "black"}>Caption</text>
                </>
            );
            break;
        case PictureLayout.FullIconTextBelow:
            svgContent = (
                <>
                    <circle cx="50%" cy="40%" r="30%" fill={isDarkMode ? "white" : "black"}/>
                    <text x="50%" y="90%" textAnchor="middle" fill={isDarkMode ? "white" : "black"}>Caption</text>
                </>
            );
            break;
        case PictureLayout.Center:
            svgContent = (
                <>
                    <rect height="100%" width="100%" fill={"none"} stroke={isDarkMode ? "white" : "black"} strokeWidth={2}/>
                    <circle cx="50%" cy="50%" r="40%" fill={isDarkMode ? "white" : "black"}/>
                    <text x="50%" y="50%" textAnchor="middle" fill={isDarkMode ? "black" : "white"}>Caption</text>
                </>
            )
    }


    return (
                <SvgIcon>
                    <svg viewBox="0 0 300 200">
                {svgContent}
                    </svg>
                </SvgIcon>
            );
    }
interface NodeLayoutPropertyEditorProps{
    propAndKind: PropAndKind;
    value: CustomShape;
    updateProps: (value: CustomShape) => void;
}

export const NodeLayoutPropertyEditor: React.FC<NodeLayoutPropertyEditorProps> = (props: NodeLayoutPropertyEditorProps ) => {
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleItemClick = (layout: PictureLayout) => {
        const updateShape = {...props.value, layout: layout};
        props.updateProps(updateShape);
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
                        <NodeLayoutIcon layout={props.value?.layout} />
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
                    {enumKeys(PictureLayout).map((layoutKey, i) => (
                        <MenuItem
                            key={i}
                            sx={{height: "48px"}}
                            onClick={() => handleItemClick(PictureLayout[layoutKey as keyof typeof PictureLayout])}
                        >
                            <NodeLayoutIcon layout={PictureLayout[layoutKey as keyof typeof PictureLayout]} />
                        </MenuItem>
                    ))}
                </Menu>
            </>
        }
         label={props.propAndKind.prop.label}
        />
    );
}
