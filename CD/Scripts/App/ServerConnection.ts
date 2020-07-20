module CloudDiagram {
    import StartOptions = Web.Models.StartOptions;
    import MindMapDto = Web.Models.MindMapDto;

    export interface IWebApi<T> {
        GetById(id: string, then: (rec:T) => void): void;
        GetAll(then: (recs: T[]) => void): void;
        Create(value: T);
        Update(value: T, id: string);            
    }

    export interface IPageReader {
        get(page: string, then: (data:any) => void, fail: () => void): void;
        post(page: string, data: string, then: (data: string, status: string) => void, fail: (error: any) => void): void;
    }

    export function createServerConnection(baseUrl: string) {
        return new ServerConnection(baseUrl);
    }

    class WebApi<T> implements IWebApi<T> {
        private static jsonType = "application/json; charset=utf-8";

        constructor(private url: string) {}


        GetById(id: string, then: (rec: T) => void): void {
            $.getJSON(this.url + "/" + id)
                .done(data => { then(<T>data) })
                .fail(() => { throw Error("error in " + this.url + ".getbyId(" + id + ")") });
        }

        GetAll(then: (recs: T[]) => void): void {
            $.ajax({
                url: this.url,
                dataType: 'json',
                timeout: 20000,
                success: data => { then(<T[]>data) },
                error: e => {
                    throw Error("error in " + this.url + ".getAll() with " + e);
                }
            });
        }

        Create(value: T) {
            $.ajax({
                url: this.url,
                type: "POST",
                contentType: WebApi.jsonType,
                data: JSON.stringify(value)
            });            
        }

        Update(value: T, id: string) {
            $.ajax({
                url: this.url + "/" + id,
                type: "PUT",
                contentType: WebApi.jsonType,
                data: JSON.stringify(value)
            });              
        }
    }

    class PageReader implements IPageReader {
        constructor(private baseUrl: string) {  }

        get(page: string, then: (data: any) => void, fail: () => void): void {
            $.get(page)
                .done(content => { then(content) })
                .fail(() => fail());
        }
        post(page: string, data: string, then: (data: string, status: string) => void, fail: (error:any) => void): void {
            $.post(page, data)
                .done((content,status) => { then(content, status) })
                .fail((err) => fail(err));
        }
}

    export interface IServerConnection {
        startOptions: IWebApi<StartOptions>;
        diagrams: IWebApi<Web.Models.MindMapDto>;
        pageReader: IPageReader;
    }

    class ServerConnection implements IServerConnection {
        constructor(private baseUrl: string) {
        }

        startOptions = new WebApi<StartOptions>(this.baseUrl + "startOptions");
        diagrams = new WebApi<MindMapDto>(this.baseUrl + "diagram");
        pageReader = new PageReader(this.baseUrl);
    }
}