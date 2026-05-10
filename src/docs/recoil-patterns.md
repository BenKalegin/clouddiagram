# Recoil State Management Patterns

This document outlines the consistent patterns for using Recoil state management in the Cloud Diagram application.

## State Definition

### Location of State Definitions

All Recoil state (atoms and selectors) should be defined in model files, not component files. Each feature should have its own model file(s) for state definitions.

Examples:
- `src/features/diagramTabs/diagramTabsModel.ts`
- `src/features/diagramEditor/diagramEditorModel.ts`
- `src/features/sequenceDiagram/sequenceDiagramModel.ts`

### Naming Conventions

- Atoms should end with "Atom" (e.g., `activeDiagramIdAtom`, `linkingAtom`)
- Selectors should end with "Selector" (e.g., `diagramTitleSelector`, `selectedElementsSelector`)
- Selector families should also end with "Selector" (e.g., `diagramKindSelector`, `nodePlacementSelector`)

### Documentation

All atoms and selectors should have JSDoc comments explaining their purpose and usage.

Example:
```typescript
/**
 * Atom representing the currently active diagram ID
 */
export const activeDiagramIdAtom = atom<Id>({
    key: 'activeDiagramId',
    default: demoActiveDiagramId
});
```

## State Usage

### Importing State

Import atoms and selectors from their respective model files, not from component files.

Example:
```typescript
import { activeDiagramIdAtom } from "../diagramTabs/diagramTabsModel";
```

### Reading State

Use the appropriate Recoil hooks to read state:
- `useRecoilValue` for read-only access
- `useRecoilState` for read-write access

Example:
```typescript
const [activeDiagramId, setActiveDiagramId] = useRecoilState(activeDiagramIdAtom);
const openDiagramIds = useRecoilValue(openDiagramIdsAtom);
```

### Modifying State

For simple state updates, use the setter function returned by `useRecoilState`.

For complex state updates that involve multiple atoms or derived state, use selectors with setters or transaction functions.

Example of a selector with a setter:
```typescript
export const structureDiagramSelector = selectorFamily<StructureDiagramState, DiagramId>({
    key: 'structureDiagram',
    get: (id) => ({get}) => {
        return get(elementsAtom(id)) as StructureDiagramState;
    },
    set: (id) => ({set}, newValue) => {
        set(elementsAtom(id), newValue);
    }
})
```

Example of a transaction function:
```typescript
export function useHandleElementCommand() {
    return useRecoilTransaction_UNSTABLE(
        ({get, set}) => (elements: ElementRef[], command: Command) => {
            // Complex state update logic here
        }
    );
}
```

## State Organization

### Feature-Based Organization

Organize state by feature, with each feature having its own model file(s) for state definitions.

### Shared State

State that is used across multiple features should be defined in a shared location, such as a common model file or a dedicated state directory.

## Testing

When testing components that use Recoil state, wrap them in a `RecoilRoot` component to provide the necessary context.

Example:
```tsx
import { RecoilRoot } from "recoil";

test("Component renders correctly", () => {
    render(
        <RecoilRoot>
            <ComponentUnderTest />
        </RecoilRoot>
    );
    // Test assertions here
});
```