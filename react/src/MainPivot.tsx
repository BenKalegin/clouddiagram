import {Pivot, PivotItem} from "@fluentui/react";
import React from "react";

const getTabId = (itemKey: string) => {
    return `ShapeColorPivot_${itemKey}`;
};

export function MainPivot(props: { onLinkClick: (item?: PivotItem) => void }) {
    return <Pivot
        aria-label="Open diagrams"
        headersOnly={true}
        onLinkClick={props.onLinkClick}
        getTabId={getTabId}
    >
        <PivotItem headerText="Class Diagram" itemKey="class"/>
        <PivotItem headerText="Sequence Diagram" itemKey="sequence"/>
        <PivotItem headerText="Deployment Diagram" itemKey="deployment"/>
    </Pivot>;
}