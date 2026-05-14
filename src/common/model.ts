import {DiagramElement, ElementRef} from "../package/packageModel";
import {NoteId, NoteState} from "../features/commonComponents/commonComponentsModel";

// Geometry primitives live in @benkalegin/doodles-core (single source of truth
// shared with the layout layer). Re-exported here so cd source can keep
// importing from "common/model".
export {
    type Coordinate,
    type Bounds,
    zeroCoordinate,
    zeroBounds,
    inflate,
    rightOf,
    withinBounds,
    withinXBounds,
    withinYBounds,
    minus,
    center,
    type DiagramDisplay,
    defaultDiagramDisplay,
} from "@benkalegin/doodles-api";

export interface Diagram extends DiagramElement {
    title?: string
    selectedElements: ElementRef[]
    notes: {[id: NoteId]: NoteState}
    display: import("@benkalegin/doodles-api").DiagramDisplay
}
