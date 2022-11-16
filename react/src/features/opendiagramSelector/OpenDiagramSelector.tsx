import React from "react";
import {useAppDispatch, useAppSelector} from "../../app/hooks";
import {openDiagramActivated} from "./openDiagramSlice";
import {Pivot, PivotItem} from "@fluentui/react";

export const OpenDiagramSelector = () => {
    const dispatch = useAppDispatch();
    const model = useAppSelector(state => state.openDiagrams);

    return (
        <Pivot
        aria-label="Open diagrams"
        headersOnly={true}
        onLinkClick={(item) => {dispatch(openDiagramActivated(+item!.props.itemKey!))}}
        >
            {model.diagrams.map((diagram, index) =>
                <PivotItem headerText={diagram.metadata.title} itemKey={"" + index} key={index}/>)
            }
    </Pivot>)
}
