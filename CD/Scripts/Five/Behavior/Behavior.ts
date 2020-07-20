module Five {
    import MindMapDto = CloudDiagram.Web.Models.MindMapDto;

    export interface IBehaviorAction {
        setSelectionProvider(provider: IPresentationSelection);
        getKeyCode(): KeyCode;
        getKeyModifier(): KeyModifier;
        isEnabled(): boolean;
        execute();
        getCaption(): string;
        getGroup(): number;
    }

    export function behaviorAction(caption: string, group: number, keyCode: KeyCode, keyModifier: KeyModifier,
        isEnabled: (sel: IPresentationSelection) => boolean, 
        execute: (sel: IPresentationSelection) => void) : IBehaviorAction {
        return new BehaviorAction(caption, group, keyCode, keyModifier, isEnabled, execute);
    }

    class BehaviorAction implements IBehaviorAction {
        constructor(private caption: string, private group: number, private keyCode: KeyCode, private keyModifier: KeyModifier,
            private _isEnabled: (sel: IPresentationSelection) => boolean,
            private _execute: (sel: IPresentationSelection) => void) {
        }

        setSelectionProvider(provider: IPresentationSelection) {
            this.selectionProvider = provider;
        }

        private selectionProvider: IPresentationSelection;

        getKeyCode(): KeyCode { return this.keyCode }

        getKeyModifier(): KeyModifier { return this.keyModifier }

        isEnabled(): boolean {
            return this._isEnabled(this.selectionProvider);
        }

        execute() {
            this._execute(this.selectionProvider);
        }

        getCaption(): string { return this.caption; }

        getGroup(): number { return this.group; }
    }

    export interface IBehavior {
        actions: IBehaviorAction[];
        setPresentation(presenter: IPresenter) : void;
        /**
         * Create some initial elements for new diagram
         */
        bootstrap(): void;
        getDiagram(): MindMapDto;
        load(mindMapDto: MindMapDto): void;
        allowResize: boolean;
        setDockPanelFactory(dockPanelFactory: CloudDiagram.IOverlayFactory);
        menuCaption(): string;
    }
}