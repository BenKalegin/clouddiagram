import { Menu, MenuTrigger, MenuContent, MenuItem } from "@benkalegin/ui26";
import { Plus } from "@benkalegin/ui26/icons";
import { ElementType } from "../../package/packageModel";
import { addDiagramTabAction, useDispatch } from "../diagramEditor/diagramEditorSlice";
import { diagramTypeDefinitions } from "../diagramTypes/diagramTypeRegistry";

export function AddNewTabButton() {
    const dispatch = useDispatch();

    const addTab = (diagramKind: ElementType) => {
        dispatch(addDiagramTabAction({ diagramKind }));
    };

    return (
        <Menu>
            <MenuTrigger className="add-tab-trigger">
                <Plus size={16} />
            </MenuTrigger>
            <MenuContent>
                {diagramTypeDefinitions.map((definition) => (
                    <MenuItem
                        key={definition.type}
                        onSelect={() => addTab(definition.type)}
                    >
                        {definition.title}
                    </MenuItem>
                ))}
            </MenuContent>
        </Menu>
    );
}
