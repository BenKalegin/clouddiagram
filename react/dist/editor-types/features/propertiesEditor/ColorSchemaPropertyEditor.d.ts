import { ColorSchema } from "../../package/packageModel";
import React from "react";
import { PropAndKind } from "./propertiesEditorModel";
interface ColorSchemaPropertyEditorProps {
    propAndKind: PropAndKind;
    value: ColorSchema;
    updateProps: (value: any) => void;
}
export declare const ColorSchemaPropertyEditor: React.FC<ColorSchemaPropertyEditorProps>;
export {};
//# sourceMappingURL=ColorSchemaPropertyEditor.d.ts.map