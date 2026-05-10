import React from "react";
import {
    CloudDiagramEditor,
    CLOUD_DIAGRAM_SCHEMA_VERSION,
    PersistenceMode,
    type CloudDiagramDocument
} from ".";
import {defaultDiagramDisplay} from "../common/model";
import {ElementType} from "../package/packageModel";

const smokeDocument: CloudDiagramDocument = {
    schemaVersion: CLOUD_DIAGRAM_SCHEMA_VERSION,
    diagram: {
        id: "smoke-diagram",
        type: ElementType.ClassDiagram,
        title: "Smoke Diagram",
        selectedElements: [],
        notes: {},
        display: defaultDiagramDisplay,
        nodes: {},
        ports: {},
        links: {}
    } as CloudDiagramDocument["diagram"],
    elements: {}
};

export const editorPublicApiSmoke = (
    <CloudDiagramEditor
        value={smokeDocument}
        persistenceMode={PersistenceMode.Host}
        onChange={() => {}}
        onSave={() => {}}
    />
);
