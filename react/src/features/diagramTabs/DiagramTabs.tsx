import React from "react";
import {useAppDispatch, useAppSelector} from "../../app/hooks";
import {ClassDiagramEditor} from "../classDiagram/ClassDiagramEditor";
import {NodePropertiesDialog} from "../classDiagram/dialogs/NodePropertiesDialog";
import {SequenceDiagramEditor} from "../sequenceDiagram/SequenceDiagramEditor";
import {HtmlDrop} from "./HtmlDrop";
import {Stack, styled, Tab, Tabs} from "@mui/material";
import {LinkToNewDialog} from "../classDiagram/dialogs/LinkToNewDialog";
import {openDiagramActivated} from "./diagramTabsSlice";
import {DiagramEditorType} from "../diagramEditor/diagramEditorModel";


interface StyledTabProps {
    label: string;
}

const PlainTab = styled((props: StyledTabProps) => <Tab disableRipple {...props} />)(
    () => ({
        textTransform: 'none'
    }),
);

export const DiagramTabs = () => {
    const dispatch = useAppDispatch();
    const editors = useAppSelector(state => state.diagramTabs);
    const activeEditor = editors.editors[editors.activeIndex]

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        dispatch(openDiagramActivated(newValue));
    };

    return (
        <Stack direction="column" spacing="2">
            <Tabs
                value={editors.activeIndex}
                onChange={handleChange}
                aria-label="Open diagrams"
            >
            {editors.editors.map((editor, index) =>
                <PlainTab key={index}  label={editor.diagram.title || "New diagram"} />
            )}
            </Tabs>
            <div>
                <HtmlDrop>
                    {activeEditor.type === DiagramEditorType.Class && <ClassDiagramEditor/>}
                    {activeEditor.type === DiagramEditorType.Sequence && <SequenceDiagramEditor/>}
                </HtmlDrop>
            </div>
            {activeEditor.type === DiagramEditorType.Class && <NodePropertiesDialog/>}
            {activeEditor.type === DiagramEditorType.Class && <LinkToNewDialog/>}
        </Stack>
    )
}
