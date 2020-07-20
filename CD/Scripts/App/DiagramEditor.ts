module CloudDiagram {
    import KeyHandler = Five.KeyHandler;
    import MindMapDto = Web.Models.MindMapDto;

    export interface IDiagramEditor {
        getDiagram() : MindMapDto;
        getDiagramId(): string;
    }

    export function createDiagramEditor(container: HTMLElement, behavior: Five.IBehavior, diagramId: string, diagram: MindMapDto): IDiagramEditor {
        return new DiagramEditor(container, behavior, diagramId, diagram);
    }


    class DiagramEditor implements IDiagramEditor {

        bindKeyAction(action: Five.IBehaviorAction) {

            var handler = (evt: KeyboardEvent) => {
                if (action.isEnabled())
                   action.execute();
            };
            this.keyHandler.bindKey(action.getKeyModifier(), action.getKeyCode(), handler);
        }

        private createGraph(): Five.Graph {
            var model = new Five.GraphModel();
            var graph = new Five.Graph(this.container, this.defaultConfig(), model);
            return graph;
        }

        constructor(private container: HTMLElement, private behavior: Five.IBehavior, private diagramId: string, diagram: MindMapDto) {
            this.graph = this.createGraph();
            var graphPresenter: Five.IPresenter = Five.graphPresenter(this.graph);
            behavior.setPresentation(graphPresenter);
            this.keyHandler = new KeyHandler(this.graph);

            behavior.actions.forEach(a => a.setSelectionProvider(graphPresenter));
            Menus.setupDiagramContextActions(behavior.actions, behavior.menuCaption());
            behavior.actions.forEach(a => this.bindKeyAction(a));
            behavior.setDockPanelFactory(createDockPanelFactory(container));

            this.graph.cellsResizable = behavior.allowResize;
            if (diagramId)
                behavior.load(diagram);
            else
                behavior.bootstrap();
        }

        private defaultConfig(): Five.IGraphConfig {
            return {
                nodeSelection: {
                    color: "#FF0000",
                    strokeWidth: 3,
                    dashed: true
                },
                selectionHandle: {
                    fillColor: "#00FF00",
                    strokeColor: "black",
                    size: 7
                }
            }
        }

        keyHandler: Five.KeyHandler;
        graph: Five.Graph;

        getDiagram(): MindMapDto {
            return this.behavior.getDiagram();
        }

        getDiagramId(): string {
            return this.diagramId;
        }
    }
}