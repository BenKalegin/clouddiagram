import React from "react";
import {useAppDispatch, useAppSelector} from "../../app/hooks";
import {Pivot, PivotItem, Stack} from "@fluentui/react";
import styles from "../../diagramContainer/DiagramContainer.module.scss";
import {CloudDiagramEditor} from "../classDiagram/CloudDiagramEditor";
import {DiagramEditorType, openDiagramActivated} from "../classDiagram/diagramEditorSlice";
import {NodePropertiesDialog} from "../classDiagram/dialogs/NodePropertiesDialog";
import {SequenceDiagramEditor} from "../sequenceDiagram/SequenceDiagramEditor";

export const OpenDiagramSelector = () => {
    const dispatch = useAppDispatch();
    const editors = useAppSelector(state => state.diagramEditor);
    const activeEditor = editors.editors[editors.activeIndex]

    return (
        <Stack horizontal={false} verticalFill={true}>
            <Stack.Item align={"start"}>
                <Pivot
                    aria-label="Open diagrams"
                    headersOnly={true}
                    onLinkClick={(item) => {dispatch(openDiagramActivated(+item!.props.itemKey!))}}
                >
                    {editors.editors.map((editor, index) =>
                        <PivotItem headerText={editor.diagram.title} itemKey={"" + index} key={index}/>)
                    }
                </Pivot>
            </Stack.Item>
            <Stack.Item>
                <div className={styles.container}>
                    {activeEditor.type === DiagramEditorType.Class && <CloudDiagramEditor/>}
                    {activeEditor.type === DiagramEditorType.Sequence && <SequenceDiagramEditor/>}
                </div>;
            </Stack.Item>
            {activeEditor.type === DiagramEditorType.Class && <NodePropertiesDialog/>}
        </Stack>

    )


}
