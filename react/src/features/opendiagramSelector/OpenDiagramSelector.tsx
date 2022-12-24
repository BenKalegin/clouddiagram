import React from "react";
import {useAppDispatch, useAppSelector} from "../../app/hooks";
import {ClassDiagramEditor} from "../classDiagram/ClassDiagramEditor";
import {DiagramEditorType, openDiagramActivated} from "../classDiagram/diagramEditorSlice";
import {NodePropertiesDialog} from "../classDiagram/dialogs/NodePropertiesDialog";
import {SequenceDiagramEditor} from "../sequenceDiagram/SequenceDiagramEditor";
import {HtmlDrop} from "./HtmlDrop";
import {Stack, styled, Tab, Tabs} from "@mui/material";


interface StyledTabProps {
    label: string;
}

const AntTab = styled((props: StyledTabProps) => <Tab disableRipple {...props} />)(
    () => ({
        textTransform: 'none',
    }),
);

export const OpenDiagramSelector = () => {
    const dispatch = useAppDispatch();
    const editors = useAppSelector(state => state.diagramEditor);
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
                <AntTab key={index}  label={editor.diagram.title || "New diagram"} />
            )}
            </Tabs>
            <div>
                <HtmlDrop>
                    {activeEditor.type === DiagramEditorType.Class && <ClassDiagramEditor/>}
                    {activeEditor.type === DiagramEditorType.Sequence && <SequenceDiagramEditor/>}
                </HtmlDrop>
            </div>
            {activeEditor.type === DiagramEditorType.Class && <NodePropertiesDialog/>}
        </Stack>
    )
}
