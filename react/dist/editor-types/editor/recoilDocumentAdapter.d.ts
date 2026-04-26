import type { Snapshot } from "recoil";
import { RecoilState, RecoilValue } from "recoil";
import { CloudDiagramDocument } from "../features/export/CloudDiagramFormat";
type Get = <T>(recoilValue: RecoilValue<T>) => T;
type Set = <T>(recoilState: RecoilState<T>, value: T | ((current: T) => T)) => void;
export declare function hydrateCloudDiagramDocument(document: CloudDiagramDocument, set: Set): void;
export declare function getCloudDiagramDocument(get: Get): CloudDiagramDocument | undefined;
export declare function getCloudDiagramDocumentFromSnapshot(snapshot: Snapshot): CloudDiagramDocument | undefined;
export {};
//# sourceMappingURL=recoilDocumentAdapter.d.ts.map