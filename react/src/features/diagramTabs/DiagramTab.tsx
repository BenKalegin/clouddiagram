import {Icon, Menu, styled, Tab} from "@mui/material";
import {useRecoilValue} from "recoil";
import {DiagramId, diagramTitleSelector, ExportPhase, ImportPhase} from "../diagramEditor/diagramEditorModel";
import React, {useState} from "react";
import {
    closeDiagramTabAction,
    exportDiagramTabAction,
    importDiagramTabAction,
    useDispatch
} from "../diagramEditor/diagramEditorSlice";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import MenuItem from "@mui/material/MenuItem";
import MenuDivider from "@mui/material/Divider";
import {activeDiagramIdAtom} from "./diagramTabsModel";

export const TabHeight = '48px';


interface StyledTabProps {
    diagram_id: DiagramId
}

const objectWithoutKey = (object: any, key: string) => {
    const {[key]: deletedKey, ...otherKeys} = object;
    return otherKeys;
}

interface DiagramTabProps {
    onClose: () => void;
    diagram_id: DiagramId
}

const DiagramTab: React.FC<DiagramTabProps & React.ComponentProps<typeof Tab>> =
    ({
         onClose,
         ...props
     }) => {
        const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
        const activeDiagramId = useRecoilValue(activeDiagramIdAtom)
        const isIconVisible = props.diagram_id === activeDiagramId
        const dispatch = useDispatch()

        const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
            setAnchorEl(event.currentTarget);
        };

        const closeTab = () => {
            handleCloseMenu()
            dispatch(closeDiagramTabAction({}))
        }

        const exportTab = () => {
            handleCloseMenu()
            dispatch(exportDiagramTabAction({exportState: ExportPhase.start}))
        }
        const importTab = () => {
            handleCloseMenu()
            dispatch(importDiagramTabAction({importState: ImportPhase.start}))
        }
        const handleCloseMenu = () => {
            setAnchorEl(null);
        };

        return (

            <Tab
                sx={{height: TabHeight, minHeight: TabHeight, paddingRight: "0px"}}
                icon={<>
                    <Icon
                        aria-label="options"
                        arial-controls="tab-options-menu"
                        aria-haspopup="true"
                        onClick={handleClick}
                        sx={{
                            padding: '2px',
                            borderRadius: '50%',
                            visibility: isIconVisible ? 'visible' : 'hidden',
                            '&:hover': {
                                backgroundColor: 'rgba(0, 0, 0, 0.1)',
                            },
                        }}
                    >
                        <MoreVertIcon
                            sx={{
                                fontSize: '14px',
                                marginBottom: '0.4em',
                            }}
                        />
                    </Icon>
                    <Menu
                        id="tab-options-menu"
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleCloseMenu}
                    >
                        <MenuItem onClick={exportTab}>Export</MenuItem>
                        <MenuItem onClick={importTab}>Import</MenuItem>
                        <MenuDivider />
                        <MenuItem onClick={closeTab}>Close</MenuItem>
                    </Menu>
                </>
                }
                iconPosition={"end"}
                {...props}
            />
        );
    };
export const PlainTab = styled((props: StyledTabProps) => {
    const label = useRecoilValue(diagramTitleSelector(props.diagram_id)) ?? "New";

    return <DiagramTab
        label={label}
        {...objectWithoutKey(props, "diagramId")}
        disableRipple={true}
        diagram_id={props.diagram_id}
    />;
})(
    () => ({
        textTransform: 'none'
    }),
);
