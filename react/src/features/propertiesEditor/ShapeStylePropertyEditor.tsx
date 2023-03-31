import {ShapeStyle} from "../../package/packageModel";
import React from "react";
import {
    Button,
    ButtonGroup,
    ClickAwayListener,
    FormControlLabel,
    Grow,
    IconButton,
    MenuList,
    Paper,
    Popper, SvgIcon
} from "@mui/material";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import MenuItem from "@mui/material/MenuItem";
import {PropAndKind} from "./PropertiesEditor";

function shapeStyleIcon(fill: string, stroke: string) {
    return <SvgIcon>
        <svg viewBox="0 0 100 80">
            <rect
                rx="15"
                ry="15"
                y="10"
                x="10"
                height="60"
                width="80"
                fill={fill}
                stroke={stroke}
                strokeWidth={2}
            />
        </svg>
    </SvgIcon>;
}

interface ShapeStylePropertyEditorProps{
   propAndKind: PropAndKind
    value: ShapeStyle
}

export const ShapeStylePropertyEditor: React.FC<ShapeStylePropertyEditorProps> = ( props: ShapeStylePropertyEditorProps ) => {
    // const anchorRef = React.useRef<HTMLDivElement>(null);
    const [popupOpen, setPopupOpen] = React.useState(false);
    // const [selectedIndex, setSelectedIndex] = React.useState(1);

    const options = ['Create a merge commit', 'Squash and merge', 'Rebase and merge'];

    const handleClick = () => {
        console.info(`You clicked`);
    };

    const handleMenuItemClick = (
        event: React.MouseEvent<HTMLLIElement, MouseEvent>,
        index: number,
    ) => {
        //setSelectedIndex(index);
        //setPopupOpen(false);
    };

    const handleToggle = () => {
        //setPopupOpen((prevOpen) => !prevOpen);
    };

    const handleClose = (event: Event) => {
        // if (
        //     // anchorRef.current &&
        //     // anchorRef.current.contains(event.target as HTMLElement)
        // ) {
        //     return;
        // }

        //setPopupOpen(false);
    };

    return <FormControlLabel control={
        <>
            <ButtonGroup variant="text" aria-label="split button">
                <IconButton
                    aria-label="change color"
                    sx={{
                        borderRadius: "10%"
                    }}
                >
                    {shapeStyleIcon(props.value.fillColor, props.value.strokeColor)}
                </IconButton>
                {/*<Button onClick={handleClick}>{options[selectedIndex]}</Button>*/}
                <Button
                    size="small"
                    // aria-controls={popupOpen ? 'split-button-menu' : undefined}
                    // aria-expanded={popupOpen ? 'true' : undefined}
                    aria-label="select merge strategy"
                    aria-haspopup="menu"
                    onClick={handleToggle}
                >
                    <ArrowDropDownIcon/>
                </Button>
            </ButtonGroup>
            <Popper
                sx={{
                    zIndex: 1,
                }}
                open={false}
                // open={popupOpen}
                // anchorEl={anchorRef.current}
                role={undefined}
                transition
                disablePortal
            >
                {({TransitionProps, placement}) => (
                    <Grow
                        {...TransitionProps}
                        style={{
                            transformOrigin:
                                placement === 'bottom' ? 'center top' : 'center bottom',
                        }}
                    >
                        <Paper>
                            <ClickAwayListener onClickAway={handleClose}>
                                <MenuList id="split-button-menu" autoFocusItem>
                                    {options.map((option, index) => (
                                        <MenuItem
                                            key={option}
                                            disabled={index === 2}
                                            // selected={index === selectedIndex}
                                            onClick={(event) => handleMenuItemClick(event, index)}
                                        >
                                            {option}
                                        </MenuItem>
                                    ))}
                                </MenuList>
                            </ClickAwayListener>
                        </Paper>
                    </Grow>
                )}
            </Popper>
        </>
    } label={props.propAndKind.prop.label}
    />;
};
