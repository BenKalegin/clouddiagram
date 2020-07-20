var CloudDiagram;
(function (CloudDiagram) {
    function createServerConnection(baseUrl) {
        return new ServerConnection(baseUrl);
    }
    CloudDiagram.createServerConnection = createServerConnection;
    var WebApi = (function () {
        function WebApi(url) {
            this.url = url;
        }
        WebApi.prototype.GetById = function (id, then) {
            var _this = this;
            $.getJSON(this.url + "/" + id).done(function (data) {
                then(data);
            }).fail(function () {
                throw Error("error in " + _this.url + ".getbyId(" + id + ")");
            });
        };
        WebApi.prototype.GetAll = function (then) {
            var _this = this;
            $.getJSON(this.url).done(function (data) {
                then(data);
            }).fail(function () {
                throw Error("error in " + _this.url + ".getAll()");
            });
        };
        WebApi.prototype.Create = function (value) {
            $.ajax({
                url: this.url,
                type: "POST",
                contentType: WebApi.jsonType,
                data: JSON.stringify(value)
            });
        };
        WebApi.prototype.Update = function (value, id) {
            $.ajax({
                url: this.url + "/" + id,
                type: "PUT",
                contentType: WebApi.jsonType,
                data: JSON.stringify(value)
            });
        };
        WebApi.jsonType = "application/json; charset=utf-8";
        return WebApi;
    })();
    var ServerConnection = (function () {
        function ServerConnection(baseUrl) {
            this.baseUrl = baseUrl;
            this.startOptions = new WebApi(this.baseUrl + "startOptions");
            this.diagrams = new WebApi(this.baseUrl + "diagram");
        }
        return ServerConnection;
    })();
})(CloudDiagram || (CloudDiagram = {}));
//# sourceMappingURL=ServerConnection.js.map