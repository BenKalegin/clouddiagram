import { CustomShape } from "../../package/packageModel";
import React from "react";
import { PropAndKind } from "./propertiesEditorModel";
interface NodeLayoutPropertyEditorProps {
    propAndKind: PropAndKind;
    value: CustomShape;
    updateProps: (value: CustomShape) => void;
}
export declare const NodeLayoutPropertyEditor: React.FC<NodeLayoutPropertyEditorProps>;
export {};
//# sourceMappingURL=NodeLayoutPropertyEditor.d.ts.map