import React, {useState} from "react";
import {ClassDiagramEditor} from "../classDiagram/ClassDiagramEditor";
import {SequenceDiagramEditor} from "../sequenceDiagram/SequenceDiagramEditor";
import {HtmlDrop} from "./HtmlDrop";
import {IconButton, Menu, Stack, styled, Tab, Tabs} from "@mui/material";
import {LinkToNewDialog} from "../classDiagram/dialogs/LinkToNewDialog";
import {atom, useRecoilBridgeAcrossReactRoots_UNSTABLE, useRecoilState, useRecoilValue} from "recoil";
import {ElementType, Id} from "../../package/packageModel";
import {DiagramId, diagramKindSelector, diagramTitleSelector, linkingAtom} from "../diagramEditor/diagramEditorModel";
import {demoActiveDiagramId, demoOpenDiagramIds} from "../demo";
import {
    addDiagramTabAction,
    closeDiagramTabAction,
    elementSelectedAction,
    useDispatch
} from "../diagramEditor/diagramEditorSlice";
import Konva from "konva";
import {Stage} from 'react-konva';
import {AppLayoutContext} from "../../app/AppModel";
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AddIcon from '@mui/icons-material/Add';
import MenuItem from '@mui/material/MenuItem';

const TabHeight = '48px';
interface StyledTabProps {
    diagramId: DiagramId
}

const objectWithoutKey = (object: any, key: string) => {
    const {[key]: deletedKey, ...otherKeys} = object;
    return otherKeys;
}

interface CustomTabProps {
    onClose: () => void;
}
const CustomTab: React.FC<CustomTabProps & React.ComponentProps<typeof Tab>> =
    ({
        onClose,
        ...props
    }) => {
        const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
        const dispatch = useDispatch()

        const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
            setAnchorEl(event.currentTarget);
        };

        const handleCloseTab = () => {
            handleCloseMenu()
            dispatch(closeDiagramTabAction({}))
        }
        const handleCloseMenu = () => {
            setAnchorEl(null);
        };

        return (

            <Tab
                sx={{height: TabHeight, minHeight: TabHeight, paddingRight: "0px"}}
                icon={<>
                    <IconButton
                        aria-label="options"
                        arial-controls="tab-options-menu"
                        aria-haspopup="true"
                        onClick={handleClick}
                        sx={{
                            padding: '2px',
                            borderRadius: '50%',
                            '&:hover': {
                                backgroundColor: 'rgba(0, 0, 0, 0.1)',
                            },
                        }}
                    >
                        <MoreVertIcon
                            sx={{
                                fontSize: '14px',
                            }}
                        />
                    </IconButton>
                    <Menu
                        id="tab-options-menu"
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleCloseMenu}
                    >
                        <MenuItem onClick={handleCloseTab}>Close</MenuItem>
                    </Menu>
                </>
                }
                iconPosition={"end"}
                {...props}
            />
        );
    };
const PlainTab = styled((props: StyledTabProps) => {
    const label = useRecoilValue(diagramTitleSelector(props.diagramId)) ?? "New";

    return <CustomTab
        label={label}
        {...objectWithoutKey(props, "diagramId")}
        disableRipple = {true}
    />;
    })(
    () => ({
        textTransform: 'none'
    }),
);

export const activeDiagramIdAtom = atom<Id>({
    key: 'activeDiagramId',
    default: demoActiveDiagramId
})

export const openDiagramIdsAtom = atom<DiagramId[]>({
    key: 'openDiagrams',
    default: demoOpenDiagramIds
})

function AddNewTabButton() {
    const dispatch = useDispatch()
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

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
            <MenuItem onClick={() => handleClose(ElementType.ClassDiagram)}>Class Diagram</MenuItem>
            <MenuItem onClick={() => handleClose(ElementType.SequenceDiagram)}>Sequence Diagram</MenuItem>
        </Menu>
        </div>
    );
}

export const DiagramTabs = () => {
    const [activeDiagramId, setActiveDiagramId] = useRecoilState(activeDiagramIdAtom);
    const openDiagramIds = useRecoilValue(openDiagramIdsAtom);
    const linking = useRecoilValue(linkingAtom)

    const diagramKind = useRecoilValue(diagramKindSelector(activeDiagramId!))
    const dispatch = useDispatch()
    const checkDeselect = (e: Konva.KonvaEventObject<MouseEvent>) => {
        // deselect when clicked on empty area
        const clickedOnEmpty = e.target === e.target.getStage()
        if (clickedOnEmpty) {
            if (clickedOnEmpty) {
                dispatch(elementSelectedAction({element: undefined, shiftKey: e.evt.shiftKey, ctrlKey: e.evt.ctrlKey}))
            }
        }
    }


    const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
        setActiveDiagramId(openDiagramIds[newValue]);
    }

    const Bridge = useRecoilBridgeAcrossReactRoots_UNSTABLE();

    return (
        <Stack direction="column" spacing="2">
            <Stack direction="row" spacing="2">
                <Tabs
                    sx={{height: TabHeight, minHeight: TabHeight}}
                    value={openDiagramIds.indexOf(activeDiagramId!)}
                    onChange={handleTabChange}
                    aria-label="Open diagrams"
                >
                    {openDiagramIds.map((diagramId, index) =>
                        <PlainTab key={index} diagramId={diagramId} />
                    )}
                </Tabs>
                <AddNewTabButton/>
            </Stack>
            <div>
                <HtmlDrop>
                    <AppLayoutContext.Consumer>
                    { value => (
                        <Stage
                            width={window.innerWidth}
                            height={window.innerHeight}
                            onMouseDown={e => checkDeselect(e)}
                        >
                            <Bridge>
                                <AppLayoutContext.Provider value={value}>
                                    {diagramKind === ElementType.ClassDiagram && <ClassDiagramEditor diagramId={activeDiagramId!}/>}
                                    {diagramKind === ElementType.SequenceDiagram && <SequenceDiagramEditor diagramId={activeDiagramId!}/>}
                                </AppLayoutContext.Provider>
                            </Bridge>
                        </Stage>
                    )}
                    </AppLayoutContext.Consumer>
                </HtmlDrop>
            </div>
            {linking && linking.showLinkToNewDialog && <LinkToNewDialog/>}

        </Stack>
    )
}
