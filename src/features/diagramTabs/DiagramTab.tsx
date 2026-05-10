import {Tab, Menu, MenuTrigger, MenuContent, MenuItem} from "@benkalegin/ui26";
import {MoreVertical} from "@benkalegin/ui26/icons";
import {useAtomValue} from "jotai";
import {DiagramId, diagramTitleSelector, ExportPhase, ImportPhase} from "../diagramEditor/diagramEditorModel";
import React from "react";
import {
    closeDiagramTabAction,
    exportDiagramTabAction,
    importDiagramTabAction,
    useDispatch
} from "../diagramEditor/diagramEditorSlice";
import {activeDiagramIdAtom} from "./diagramTabsModel";
import "./DiagramTab.css";

export const TabHeight = "40px";

interface PlainTabProps {
    diagram_id: DiagramId;
}

export const PlainTab: React.FC<PlainTabProps> = ({diagram_id}) => {
    const label = useAtomValue(diagramTitleSelector(diagram_id)) ?? "New";
    const activeDiagramId = useAtomValue(activeDiagramIdAtom);
    const isActive = diagram_id === activeDiagramId;
    const dispatch = useDispatch();

    const closeTab = () => dispatch(closeDiagramTabAction({}));
    const exportTab = () => dispatch(exportDiagramTabAction({exportState: ExportPhase.start}));
    const importTab = () => dispatch(importDiagramTabAction({importState: ImportPhase.start}));

    return (
        <div className="diagram-tab-wrapper">
            <Tab value={diagram_id}>{label}</Tab>
            <span className="diagram-tab__menu-slot">
                {isActive && (
                    <Menu>
                        <MenuTrigger className="diagram-tab__menu-trigger">
                            <MoreVertical size={14} aria-label="options"/>
                        </MenuTrigger>
                        <MenuContent>
                            <MenuItem onSelect={exportTab}>Export</MenuItem>
                            <MenuItem onSelect={importTab}>Import</MenuItem>
                            <MenuItem onSelect={closeTab}>Close</MenuItem>
                        </MenuContent>
                    </Menu>
                )}
            </span>
        </div>
    );
};
