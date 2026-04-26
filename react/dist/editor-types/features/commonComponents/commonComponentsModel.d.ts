import { DiagramElement, Id, HasColorSchema } from "../../package/packageModel";
import { Bounds } from "../../common/model";
import { DiagramId } from "../diagramEditor/diagramEditorModel";
export type NoteId = Id;
export interface NoteState extends DiagramElement, HasColorSchema {
    text: string;
    bounds: Bounds;
}
export declare const noteSelector: (param: {
    noteId: NoteId;
    diagramId: DiagramId;
}) => import("recoil").RecoilValueReadOnly<NoteState>;
//# sourceMappingURL=commonComponentsModel.d.ts.map