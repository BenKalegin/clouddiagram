module Five {
    export class FileStructure {
        private static _basePath: string;

    /** Basepath for all URLs in the core without trailing slash. Default is '.'.
     * When using a relative path, the path is relative to the URL of the page that contains the assignment. 
     * Trailing slashes are automatically removed. */

        static get basePath(): string { return FileStructure._basePath; }
        static set basePath(value: string) {

            if (value != null && value.length > 0) {
                // Adds a trailing slash if required
                if (value.substring(value.length - 1) == "/") {
                    value = value.substring(0, value.length - 1);
                }
                FileStructure._basePath = value;
            }
            else {
                FileStructure._basePath = ".";
            }
            if (!this._imageBasePath)
                this.imageBasePath = null;
        }

        private static _imageBasePath: string = null;
        /** Basepath for all images URLs in the core without trailing slash. Default is basePath + '/images'. 
         * When using a relative path, the path is relative to the URL of the page that contains the assignment. Trailing slashes are automatically removed. */
        static get imageBasePath(): string { return FileStructure._imageBasePath; }
        static set imageBasePath(value: string) {

            if (value != null && value.length > 0) {
                // Adds a trailing slash if required
                if (value.substring(value.length - 1) == "/") {
                    value = value.substring(0, value.length - 1);
                }
                FileStructure._imageBasePath = value;
            }
            else {
                FileStructure._imageBasePath = FileStructure.basePath + "/images";
            }
        }
    }
}