/// <reference path="../../Five/Client.ts"/> 

module CloudDiagram {
	import Client = Five.Client; /**
     * Depends on JQuery & Bootstrapper 3+
     */

    export interface ITreeWidgetEvents {
        onLeafSelected(id: number) : void;
    }

    export interface ITreeWidget {

    }

    export function createTreeWidget(container: HTMLElement, events: ITreeWidgetEvents, model: ITreeWidgetModel) : ITreeWidget {
        return new TreeWidget(container, events, model);
    }

    export interface ITreeWidgetModel {
        roots: ITreeNodeModel[];
    }

    export interface ITreeNodeModel {
        id?: number;
        name: string;
        folder: boolean;
        children?: ITreeNodeModel[];
    }

    /**
     * Dom structure:
     * <div>
     *    <ul>
     *      <li>
     *         
     *      <li>
     *    </ul>
     * </div>
     */
    interface IView {
        root: HTMLLIElement;
        text: HTMLSpanElement;
        icon: HTMLElement;
        children: HTMLUListElement;
        events: ITreeWidgetEvents;
        id: number;
    }

    interface IViewRef {
        view: IView;    
    }

    class TreeWidget implements ITreeWidget {
        private events: ITreeWidgetEvents;
        private container: HTMLElement;
        private currentSelection: IView = null;

        private injectRoot() : HTMLUListElement {
            var treeDiv = document.createElement("div");
            treeDiv.classList.add("tree");
            treeDiv.classList.add("well");
            var rootList = document.createElement("ul");
            treeDiv.appendChild(rootList);
            this.container.appendChild(treeDiv);
            return rootList;

        }

        constructor(container: HTMLElement, events: ITreeWidgetEvents, model: ITreeWidgetModel) {
            this.events = events;
            this.container = container;

            var rootList = this.injectRoot();
            this.appendChildren(rootList, model.roots);
        }


        private static closedFolderIcon = "glyphicon-chevron-right";
        private static openedFolderIcon = "glyphicon-chevron-down";

        private toggleFolderCollapsed(e) {
            var view = (<IViewRef>(<any>this)).view;
            var children = view.children;
            var span = view.text;
            var icon = view.icon;
            if ($(children).is(":visible")) {
                $(children).hide("fast");
				$(span).attr("title", "Expand this branch");
				icon.classList.add(TreeWidget.closedFolderIcon);
				icon.classList.remove(TreeWidget.openedFolderIcon);
            } else {
                $(children).show("fast");
				$(span).attr("title", "Collapse this branch");
				icon.classList.remove(TreeWidget.closedFolderIcon);
				icon.classList.add(TreeWidget.openedFolderIcon);
            }
            e.stopPropagation();
        }

        private onLeafClick(view: IView, e: MouseEvent) {
            var showSelected = (selected: boolean) => {
                var classList = this.currentSelection.text.classList;
                if (selected) {
                    classList.add("list-group-item");
                    classList.add("active");
                } else {
                    classList.remove("active");
                    classList.remove("list-group-item");
                }
            }
            if (this.currentSelection) {
                showSelected(false);
                this.currentSelection = null;
            }

            view.events.onLeafSelected(view.id);
            this.currentSelection = view;
            showSelected(true);
            e.stopPropagation();
        }

        private createView(node: ITreeNodeModel) : IView {

            var result: IView = {
                root: null,
                text: null,
                icon: null,
                children: null,
                events: this.events,
                id: node.id
            }

            result.icon = document.createElement("i");
            result.icon.classList.add("glyphicon");
            if (node.folder)
                result.icon.classList.add(TreeWidget.closedFolderIcon);
	        result.icon.style.paddingRight = "4px";
            result.text = document.createElement("span");
            result.text.textContent = node.name;
			result.text.insertBefore(result.icon, null);
			if (Client.isFf)
				result.text.insertBefore(result.icon, null);
            else
				result.text.insertAdjacentElement("afterbegin", result.icon);

            result.root = document.createElement("li");
            result.root.appendChild(result.text);

            if (node.folder) {
                result.children = document.createElement("ul");
	            result.children.style.display = "none"; 
                this.appendChildren(result.children, node.children);
                result.root.appendChild(result.children);
            }
            
            if (node.folder)
                result.root.onclick = this.toggleFolderCollapsed;
            else
                result.root.onclick = (e) => this.onLeafClick(result, e);

            (<IViewRef>(<any>result.root)).view = result;
            return result;
        }

        private appendChildren(treeview: HTMLUListElement, treedata: ITreeNodeModel[]) {
            treedata.forEach(node => {
                var view = this.createView(node);
                treeview.appendChild(view.root);
            });
        }

    }
}