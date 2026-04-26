/// <reference types="react" />
import { ActivationId } from "./sequenceDiagramModel";
import { DiagramId } from "../diagramEditor/diagramEditorModel";
import { ColorSchema } from "../../package/packageModel";
export interface ActivationProps {
    activationId: ActivationId;
    diagramId: DiagramId;
    colorSchema: ColorSchema;
}
export declare const Activation: ({ activationId, diagramId, colorSchema }: ActivationProps) => JSX.Element;
//# sourceMappingURL=Activation.d.ts.map