///<reference path="../../Five/Utils.ts"/> 

module CloudDiagram {
    import Utils = Five.Utils;

    export interface IOverlayEvents {
        onCloseClick: () => void;
    }

    export interface IHtmlLayout {
    }

    export interface IStackHtmlLayout extends IHtmlLayout
    {
        append(widget: IHtmlWidget): void;
    }

    export interface IHtmlWidget {
        getRoot(): HTMLElement;
    }

    export enum OverlayState {
        Hidden,
        Dim,
        Active    
    }

    export interface IOverlay {
        moveTo(position: Five.Point);
        stackLayout(): IStackHtmlLayout;
        setState(value: OverlayState);
    }

    class StackHtmlLayout implements IStackHtmlLayout {
        constructor(container: HTMLDivElement) {
            this.list = document.createElement("ul");
            //this.list.classList.add("dropdown-menu");
            this.list.classList.add("styleselect");
            container.appendChild(this.list);
        }

        append(widget: IHtmlWidget): void {
            var li = document.createElement("li");
            li.appendChild(widget.getRoot());
            this.list.appendChild(li);
        }

        private list: HTMLUListElement;
    }

    export interface IOverlayFactory {
        createOverlay(events: IOverlayEvents): IOverlay;
    }

    export function createDockPanelFactory(container: HTMLElement) : IOverlayFactory {
        return {
            createOverlay: (events: IOverlayEvents): IOverlay => new Overlay(container, events)
        };
    }

    class Overlay implements IOverlay {
        constructor(container: HTMLElement, private events: IOverlayEvents) {
            this.window = document.createElement("div");
            this.window.classList.add("overlay");
            this.window.classList.add("dropdown-menu");
            this.window.classList.add("context-panel");
            this.window.style.minHeight = "300px";
            this.window.style.visibility = "visible";

            this.closePanel = document.createElement("div");
            this.closePanel.classList.add("panel-close");

            this.closeButton = this.createIcon("close");
            this.closePanel.appendChild(this.closeButton);
            this.closeButton.addEventListener("click", () => this.onClose());

            this.window.appendChild(this.closePanel);

            container.appendChild(this.window);
        }

        private onClose(): void {
            this.events.onCloseClick();
        }

        private createIcon(iconId: string): SVGSVGElement {
            var svg = <SVGSVGElement>document.createElementNS(Five.Constants.nsSvg, "svg");
            svg.width.baseVal.valueAsString = "13";
            svg.height.baseVal.valueAsString = "13";

            svg.setAttribute("viewBox", "0 0 32 32");
            /* FF has a bug that baseval = null
            svg.viewBox.baseVal.x = 0;
            svg.viewBox.baseVal.y = 0;
            svg.viewBox.baseVal.width = 32;
            svg.viewBox.baseVal.height = 32; */

            var g = <SVGGElement>document.createElementNS(Five.Constants.nsSvg, "g");
            g.setAttribute("filter", "");
            //g.appendChild(this.createCircle());
            var use = <SVGUseElement>document.createElementNS(Five.Constants.nsSvg, "use");
            use.setAttributeNS(Five.Constants.nsXlink, "xlink:href", "#" + iconId); 
            g.appendChild(use);
            svg.appendChild(g);
            return svg;
        }
        private window: HTMLDivElement;
        private closePanel: HTMLDivElement;
        private closeButton: SVGSVGElement;

        moveTo(position: Five.Point) {
            this.window.style.left = Utils.pixels(position.x);
            this.window.style.top = Utils.pixels(position.y);
        }

        stackLayout(): IStackHtmlLayout {
            return new StackHtmlLayout(this.window);
        }

        setState(state: OverlayState): void {
            switch (state) {
            case OverlayState.Hidden:
                this.window.classList.remove("open");
                break;

            case OverlayState.Dim:
            default:
                this.window.classList.add("open");
                this.window.classList.add("dim");
                break;

            case OverlayState.Active:
                this.window.classList.add("open");
                this.window.classList.remove("dim");
                break;
            }
        }
    }
}