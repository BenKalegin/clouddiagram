import {Coordinate, Diagram} from "../../common/model";
import {snapToBounds, snapToGrid} from "../../common/Geometry/snap";
import {SequenceDiagramState} from "./model";

// export interface SequenceDiagramEditor extends BaseDiagramEditor{
//     type: DiagramEditorType.Sequence
//     diagram: SequenceDiagramState
// }


// const initialState: SequenceDiagramEditor = {
//     diagram: {} as SequenceDiagramState,
//     selectedElements: [],
//     snapGridSize: 0,
//     type: DiagramEditorType.Sequence
//
// }

// export const sequenceDiagramSlice = createSlice({
//     name: 'sequenceDiagramEditor',
//     initialState,
//     reducers: {
//         nodeResize: (editor, action: PayloadAction<ElementResizeAction>) => {
//             resizeLifeline(editor.diagram, action.payload.deltaBounds, action.payload.elementId);
//         },
//
//         dropFromPalette: (editor, action: PayloadAction<DropFromPaletteAction>) => {
//             const id = generateId();
//             handleSequenceDropFromLibrary(editor.diagram, id, action.payload.droppedAt, action.payload.name);
//         },
//
//         connectExisting: (editor) => {
//             const linking = current(editor).linking!
//             autoConnectActivations(editor.diagram, linking.sourceElement, linking.targetElement!, 10);
//         },
//
//         continueLinking: (editor, action: PayloadAction<DrawLinkingAction>) => {
//             // // TODO unify with classDiagramSlice
//             // const linking = editor.linking!;
//             // // we have a chance to receive continueLinking after endLinking, ignore it
//             // if (!linking)
//             //     return
//             // const diagramPos = toDiagramPos(linking, action.payload.mousePos);
//             //
//             // let snapped: Coordinate | undefined = undefined
//             // const targetActivation = findTargetActivation(current(editor).diagram.activations, diagramPos);
//             // linking.targetElement = targetActivation?.id;
//             // if (targetActivation) {
//             //     snapped = snapToBounds(diagramPos, targetActivation.placement);
//             // }
//             // if (!snapped)
//             //     snapped = snapToGrid(diagramPos, editor.snapGridSize);
//             // linking.diagramPos = snapped
//             // linking.mousePos = action.payload.mousePos;
//         },
//
//
//         restoreDiagram: (editor, action: PayloadAction<Diagram>) => {
//             editor.diagram = action.payload as SequenceDiagramState
//         },
//
//         addNodeAndConnect: (editor, action: PayloadAction<AddNodeAndConnectAction>) => {
//             const id = generateId()
//         },
//
//     },
// })
