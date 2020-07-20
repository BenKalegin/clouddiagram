module CloudDiagram {

    export interface ILocalLoginDialogEvents {
        onLogin();
    }

    export function localLoginDialog(events: ILocalLoginDialogEvents, conn: IServerConnection): void { new LocalLoginDialog(events, conn).init() }


    class LocalLoginDialog {
        private pane: HTMLDivElement;
        private loginUrl = "account/login";
        private registerUrl = "account/register";
        private conn: IServerConnection;
        private events: ILocalLoginDialogEvents;

        constructor(events: ILocalLoginDialogEvents, conn: IServerConnection) {
            this.conn = conn;
            this.events = events;
        }

        private dialog: IBootstrapDialogInstance;

        private enableControls() {
            this.dialog.setClosable(true);            
        }

        private disableControls() {
            this.dialog.setClosable(false);            
        }

        private onFormSubmitFailed(err) {
            this.enableControls();
            alert(err);
        }

        private onAnchorClick(ev: MouseEvent) {
            var href = (<HTMLAnchorElement>ev.target).href;
            ev.preventDefault();
            this.conn.pageReader.get(href, data => this.onAnchorLoaded(data), () => alert("Registration is not avaialble"));
        }

        private onSubmitClick(ev: MouseEvent) {
            ev.preventDefault();
            var button = <HTMLInputElement>ev.target;
            button.disabled = true;
            var form = button.form;
            this.dialog.setClosable(false);
            var formData = $(form).serializeArray();
            formData.push({ name: button.name, value: button.value });
            this.conn.pageReader.post(form.action, jQuery.param(formData), (data, status) => this.adoptPage(data, status), (err) => {this.onFormSubmitFailed(err)});
        }

        private onAnchorLoaded(data: any) {
            this.adoptPage(data, null);
        }

        private adoptPage(data: string, status: string) {
            if (!data && status == "success") {
                // todo generate login event
                this.dialog.close();
            }
            this.enableControls();
            this.pane.innerHTML = data;
            var anchors = this.pane.getElementsByTagName("a");
            var i: number;
            for (i = 0; i < anchors.length; i++)
                anchors[i].onclick = (ev) => this.onAnchorClick(ev);

            var buttons = this.pane.getElementsByTagName("button");
            for (i = 0; i < buttons.length; i++)
                if (buttons[i].type == "submit" && buttons[i].form.target != "_blank") {
                    buttons[i].onclick = (ev) => this.onSubmitClick(ev);
                }
        }

        private show(data: any) {
            var options: IBootstrapDialogOptions = {
                message: this.pane,
                type: BootstrapDialog.TYPE_PRIMARY,
                //size: BootstrapDialog.SIZE_WIDE,
                title: "Login using CloudDiagram credentials"
            };
            this.dialog = BootstrapDialog.show(options);
            this.dialog.getModalFooter().hide();
            this.adoptPage(data, null);
        }

        init() {
            this.pane = document.createElement("div");
            this.conn.pageReader.get(this.loginUrl, data => this.show(data), () => alert("Login is not avaialble"));
        }

    }
}