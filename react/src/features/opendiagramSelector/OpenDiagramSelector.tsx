import React from "react";
import {useAppDispatch, useAppSelector} from "../../app/hooks";
import {Pivot, PivotItem, Stack} from "@fluentui/react";
import styles from "../../diagramContainer/DiagramContainer.module.scss";
import {DiagramEditor} from "../classDiagram/DiagramEditor";
import {openDiagramActivated} from "../classDiagram/diagramEditorSlice";
import {NodePropertiesDialog} from "../classDiagram/dialogs/NodePropertiesDialog";

export const OpenDiagramSelector = () => {
    const dispatch = useAppDispatch();
    const editors = useAppSelector(state => state.diagramEditor.editors);

    return (
        <Stack horizontal={false} verticalFill={true}>
            <Stack.Item align={"start"}>
                <Pivot
                    aria-label="Open diagrams"
                    headersOnly={true}
                    onLinkClick={(item) => {dispatch(openDiagramActivated(+item!.props.itemKey!))}}
                >
                    {editors.map((editor, index) =>
                        <PivotItem headerText={editor.diagram.metadata.title} itemKey={"" + index} key={index}/>)
                    }
                </Pivot>
            </Stack.Item>
            <Stack.Item>
                <div className={styles.container}>
                    <DiagramEditor
                    />
                </div>;
            </Stack.Item>
            <NodePropertiesDialog/>
        </Stack>

    )


}
