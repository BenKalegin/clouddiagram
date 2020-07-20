module Five {

    export class UrlConverter {
        // Specifies if the converter is enabled. Default is true.
        enabled = true;
        // Specifies the base URL to be used as a prefix for relative URLs.
        baseUrl: string = null;
        // Specifies the base domain to be used as a prefix for absolute URLs.
        baseDomain: string = null;

        private updateBaseUrl() {
            this.baseDomain = location.protocol + "//" + location.host;
            this.baseUrl = this.baseDomain + location.pathname;
            var tmp = this.baseUrl.lastIndexOf("/");

            // Strips filename etc
            if (tmp > 0) {
                this.baseUrl = this.baseUrl.substring(0, tmp + 1);
            }
        }

        isEnabled(): boolean {
            return this.enabled;
        }

        setEnabled(value: boolean) {
            this.enabled = value;
        }

        getBaseUrl(): string {
            return this.baseUrl;
        }

        setBaseUrl(value) {
            this.baseUrl = value;
        }

        getBaseDomain(): string {
            return this.baseDomain;
        }

        setBaseDomain(value: string) {
            this.baseDomain = value;
        }

        isRelativeUrl(url: string): boolean {
            return url.substring(0, 2) != "//" && url.substring(0, 7) != "http://" && url.substring(0, 8) != "https://" && url.substring(0, 10) != "data:image";
        }

        convert(url: string) {
            if (this.isEnabled() && this.isRelativeUrl(url)) {
                if (this.getBaseUrl() == null) {
                    this.updateBaseUrl();
                }

                if (url.charAt(0) == "/") {
                    url = this.getBaseDomain() + url;
                } else {
                    url = this.getBaseUrl() + url;
                }
            }

            return url;
        }
    }
}