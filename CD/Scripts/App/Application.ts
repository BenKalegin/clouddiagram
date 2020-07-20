/// <reference path="CreateNewDialog.ts"/> 
/// <reference path="Menus.ts"/> 
/// <reference path="../Five/Graph.ts"/> 
/// <reference path="../Five/Behavior/Behavior.ts"/> 

module CloudDiagram {
	import StartOptions = Web.Models.StartOptions;
    import IBehavior = Five.IBehavior;
    import KeyCode = Five.KeyCode;
    import KeyModifier = Five.KeyModifier;
    import behaviorAction = Five.behaviorAction;
    import MindMapDto = Web.Models.MindMapDto;

    export class Application {
        private static baseUrl = "api/";

        private static editor: IDiagramEditor;  
        private static serverConnection: IServerConnection;
        private static fileActions: Five.IBehaviorAction[];
        private static editActions: Five.IBehaviorAction[];
        private static loginActions: Five.IBehaviorAction[];

        static initialize(): void {
            this.setupActions();
            Menus.setupFileActions(this.fileActions);
            Menus.setupEditActions(this.editActions);
            Menus.setupLoginActions(this.loginActions);
            this.serverConnection = createServerConnection(this.baseUrl);
            this.serverConnection.startOptions.GetAll((startOptions: StartOptions[]) => {
                var diagramId = startOptions[0].lastDiagram;
                if (diagramId != undefined) {
                    this.serverConnection.diagrams.GetById(diagramId, (diagram) => this.load(diagram, diagramId));
                } else
                    this.createNew();
            });
        }


        private static setupActions() {
            this.fileActions = [
                behaviorAction("New Diagram", 1, KeyCode.n, KeyModifier.ctrl, () => true, () => Application.createNew()),
                behaviorAction("Open From", 1, KeyCode.o, KeyModifier.ctrl, () => false, () => {}),
                behaviorAction("Save", 2, KeyCode.s, KeyModifier.ctrlShift, () => !!this.editor, () => {this.save()}) 
            ];

            this.editActions = [
                behaviorAction("Undo", 1, KeyCode.z, KeyModifier.ctrl, () => true, () => {} ),
                behaviorAction("Redo", 1, KeyCode.o, KeyModifier.ctrl, () => false, () => {} )
            ];

            this.loginActions = [
                behaviorAction("Login", 1, null, null, () => true, () => { localLoginDialog(null, this.serverConnection)}),

                behaviorAction("Logout", 2, null, null, () => false, () => { })
            ];
        }

        static diagramContainer(): HTMLElement {
            return document.getElementById("diagram");
        }
        static createNew() : void {
            createNewDialog({
                onSelected: (type: DiagramType) => {
                    var behavior: IBehavior;
                    switch(type) {

                        case DiagramType.MindMap:
                            behavior = createMindMap();
                            break;

                        case DiagramType.UmlActivity:
                            behavior = Uml.createActivity();
                            break;
                        default:
                            throw new Error("unsupported language");

                    }
                    this.editor = createDiagramEditor(this.diagramContainer(), behavior, null, null);
                } });
        }

        static save() {
            var dto = this.editor.getDiagram();
            var id = this.editor.getDiagramId();
            if (id)
                this.serverConnection.diagrams.Update(dto, id);
            else
                this.serverConnection.diagrams.Create(dto);
        }

        static load(diagram: MindMapDto, diagramId: string) {
            var behavior = createMindMap();
            this.editor = createDiagramEditor(this.diagramContainer(), behavior, diagramId, diagram);
        }
    }
}