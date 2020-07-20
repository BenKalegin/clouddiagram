module Five {
    export class CanvasState {
        dx = 0;
        dy = 0;
        scale = 1;
        alpha = 1;
        fillColor: string = null;
        fillAlpha = 1;
        gradientColor: string = null;
        gradientAlpha = 1;
        gradientDirection: Direction = null;
        strokeColor: string = null;
        strokeWidth = 1;
        dashed = false;
        dashPattern = "3 3";
        lineCap = "flat";
        lineJoin = "miter";
        miterLimit = 10;
        fontColor = "#000000";
        fontBackgroundColor: string = null;
        fontBorderColor: string = null;
        fontSize = defaultStyle().fontSize;
        fontFamily = Constants.defaultFontFamily;
        fontStyle = 0;
        shadow = false;
        shadowColor = Constants.shadowColor;
        shadowAlpha = Constants.shadowOpacity;
        shadowDx = Constants.shadowOffsetX;
        shadowDy = Constants.shadowOffsetY;
        rotation = 0;
        rotationCx = 0;
        rotationCy = 0;
        transform: string = null;
    }
}