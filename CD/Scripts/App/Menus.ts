/// <reference path="CreateNewDialog.ts"/> 
/// <reference path="..\Five\KeyHandler.ts"/> 

module CloudDiagram {
    import IBehaviorAction = Five.IBehaviorAction;
    import KeyCode = Five.KeyCode;
    import KeyModifier = Five.KeyModifier;

    class MenuItem {
        constructor(public control: HTMLElement, public group: string, public action: IBehaviorAction ) {
            control.onclick = () => this.fire();
		}

        fire() {
            if (this.action.isEnabled())
                this.action.execute();
		}
    }

	export class Menus {
        private static menuFileId = "menu-group-file";
        private static menuEditId = "menu-group-edit";
        private static menuMindMapId = "menu-group-mindmap";
        private static menuLoginId = "menu-group-login";
        private static menuItems: MenuItem[] = [];
        private static diagramContextGroup: HTMLElement;
        private static diagramContextCaption: string;
        private static loginGroup: HTMLElement;
	    private static fileGroup: HTMLElement;
	    private static editGroup: HTMLElement;
        static groupRecycler: (id: string) => void;
        static groupFactory: (caption: string, id: string, beforeDropdown: (menuId: string) => void, rightSide: boolean) => HTMLElement;
        static itemFactory: (menuId: string, caption: string, hotkey: string) => HTMLElement;
        static dividerFactory: (menuId: string) => HTMLElement;

	    private static camelize(str: string) {
            return str.substr(0, 1).toUpperCase() + str.substr(1).toLowerCase();
	    }

	    private static createItem(group: string, action: IBehaviorAction) {
            var code = action.getKeyCode();
            var mod = action.getKeyModifier();
            var hotkey: string = null;
            if (code) {
                switch (mod) {
                    case KeyModifier.ctrl:
                        hotkey = "Ctrl+";
                        break;
                    case KeyModifier.shift:
                        hotkey = "Shift+";
                        break;
                    case KeyModifier.ctrlShift:
                        hotkey = "Ctrl+Shift+";
                        break;
                    default:
                        hotkey = '';
                }
                hotkey += this.camelize(KeyCode[code]);
            }
            var elem = this.itemFactory(group, action.getCaption(), hotkey);
            this.menuItems.push(new MenuItem(elem, group, action));
	    }

        private static createGroupElements(menuId: string, actions: IBehaviorAction[]) {
            var currentGroup: number = -1;

            actions.forEach(a => {
                var group = a.getGroup();
                if (currentGroup >= 0 && group != currentGroup)
                    this.dividerFactory(menuId);
                currentGroup = group;
                this.createItem(menuId, a);
                a.getGroup();
            });
        }

	    private static clearGroup(menuId: string): void{
	    }

        private static createGroup(caption: string, menuId: string, actions: IBehaviorAction[], rightSide = false): HTMLElement {
            var menu = this.groupFactory(caption, menuId, (id) => Menus.enableDisableMenuItems(id), rightSide);
            this.createGroupElements(menuId, actions);
	        return menu;
	    }

	    static setupFileActions(actions: IBehaviorAction[]) {
            if (!this.fileGroup) {
                this.fileGroup = this.createGroup("File", Menus.menuFileId, actions);
            }
        }

        static setupEditActions(actions: IBehaviorAction[]) {
            if (!this.editGroup) {
                this.editGroup = this.createGroup("Edit", Menus.menuEditId, actions);
            }
        }

        static setupDiagramContextActions(actions: IBehaviorAction[], caption: string) {
            if (!Menus.diagramContextGroup) {
                Menus.diagramContextGroup = this.createGroup(caption, Menus.menuMindMapId, actions);
            }else if (Menus.diagramContextCaption != caption) {
                this.groupRecycler(Menus.menuMindMapId);
                this.createGroupElements(Menus.menuMindMapId, actions);
            }
            Menus.diagramContextCaption = caption;
        }

        static setupLoginActions(actions: IBehaviorAction[]) {
            if (!this.loginGroup) {
                this.loginGroup = this.createGroup("Login", Menus.menuLoginId, actions, true);
            }
        }

	    static enableDisableMenuItems(groupId: string): void {
	        this.menuItems.filter(i => i.group === groupId).forEach(i => {
	            if (i.action.isEnabled())
                    i.control.classList.remove("disabled");
                else
	                i.control.classList.add("disabled");
	        });
	    }
	}
}