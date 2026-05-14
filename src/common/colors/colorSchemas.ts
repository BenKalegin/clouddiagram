import {atom} from "jotai";
import {ColorSchema, defaultColorSchema} from "@benkalegin/doodles-api";

// Color palette and default schema come from doodles-core (shared with the
// layout / future renderer). Re-exported here so existing imports keep working.
export {
    defaultColorSchema,
    colorSchemaList,
    lineStyleList,
    defaultLineStyle,
} from "@benkalegin/doodles-api";

// Per-store atom so each CloudDiagramCanvas instance can have its own default.
// jotai dependency stays out of doodles-core.
export const defaultColorSchemaAtom = atom<ColorSchema>(defaultColorSchema);
