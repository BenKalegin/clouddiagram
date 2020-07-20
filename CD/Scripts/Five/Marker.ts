module Five {
    interface IMarkerPaint {
        (canvas: AbstractCanvas2D, shape: Shape, type: ArrowStyle, pe: Point, unitX: number, unitY: number, size: number, source: boolean, sw : number, filled : boolean): () => void;        
    }

    export class Marker {
        /// <summary>A static class that implements all markers for VML and SVG using a registry. </summary>

        // Maps from markers names to functions to paint the markers.
        private static markers: { [name: string]: IMarkerPaint } = {};

        static addMarker(type: string, funct) {
            /// <summary>Adds a factory method that updates a given endpoint and returns a function to paint the marker onto the given canvas.</summary>
            Marker.markers[type] = funct;
        }

        static createMarker(canvas: AbstractCanvas2D, shape: Shape, type: ArrowStyle, pe: Point, unitX: number, unitY: number, size: number, source, sw: number, filled: boolean) {
            /// <summary>Returns a function to paint the given marker.</summary>
            var funct = Marker.markers[type];

            return (funct != null) ? funct(canvas, shape, type, pe, unitX, unitY, size, source, sw, filled) : null;
        }


        private static arrow(canvas: AbstractCanvas2D, shape: Shape, type: ArrowStyle, pe: Point, unitX: number, unitY: number, size: number, source: boolean, sw: number, filled: boolean): () => void {
            // The angle of the forward facing arrow sides against the x axis is
            // 26.565 degrees, 1/sin(26.565) = 2.236 / 2 = 1.118 ( / 2 allows for
            // only half the strokewidth is processed ).
            var endOffsetX = unitX * sw * 1.118;
            var endOffsetY = unitY * sw * 1.118;

            unitX = unitX * (size + sw);
            unitY = unitY * (size + sw);

            var pt = pe.clone();
            pt.x -= endOffsetX;
            pt.y -= endOffsetY;

            var f = (type != ArrowStyle.Classic) ? 1 : 3 / 4;
            pe.x += -unitX * f - endOffsetX;
            pe.y += -unitY * f - endOffsetY;

            return () => {
                canvas.begin();
                canvas.moveTo(pt.x, pt.y);
                canvas.lineTo(pt.x - unitX - unitY / 2, pt.y - unitY + unitX / 2);

                if (type == ArrowStyle.Classic) {
                    canvas.lineTo(pt.x - unitX * 3 / 4, pt.y - unitY * 3 / 4);
                }

                canvas.lineTo(pt.x + unitY / 2 - unitX, pt.y - unitY - unitX / 2);
                canvas.close();

                if (filled) {
                    canvas.fillAndStroke();
                } else {
                    canvas.stroke();
                }
            }
        }

        private static open(canvas: AbstractCanvas2D, shape: Shape, type: string, pe: Point, unitX: number, unitY: number, size: number, source: boolean, sw: number, filled: boolean): () => void {
            // The angle of the forward facing arrow sides against the x axis is
            // 26.565 degrees, 1/sin(26.565) = 2.236 / 2 = 1.118 ( / 2 allows for
            // only half the strokewidth is processed ).
            var endOffsetX = unitX * sw * 1.118;
            var endOffsetY = unitY * sw * 1.118;

            unitX = unitX * (size + sw);
            unitY = unitY * (size + sw);

            var pt = pe.clone();
            pt.x -= endOffsetX;
            pt.y -= endOffsetY;

            pe.x += -endOffsetX * 2;
            pe.y += -endOffsetY * 2;

            return () => {
                canvas.begin();
                canvas.moveTo(pt.x - unitX - unitY / 2, pt.y - unitY + unitX / 2);
                canvas.lineTo(pt.x, pt.y);
                canvas.lineTo(pt.x + unitY / 2 - unitX, pt.y - unitY - unitX / 2);
                canvas.stroke();
            }
        }

        private static oval(canvas: AbstractCanvas2D, shape: Shape, type: string, pe: Point, unitX: number, unitY: number, size: number, source: boolean, sw: number, filled: boolean): () => void {
            var a = size / 2;

            var pt = pe.clone();
            pe.x -= unitX * a;
            pe.y -= unitY * a;

            return () => {
                canvas.ellipse(pt.x - a, pt.y - a, size, size);

                if (filled) {
                    canvas.fillAndStroke();
                } else {
                    canvas.stroke();
                }
            }
        }

        private static diamond(canvas: AbstractCanvas2D, shape: Shape, type: ArrowStyle, pe: Point, unitX: number, unitY: number, size: number, source: boolean, sw: number, filled: boolean): () => void {
            // The angle of the forward facing arrow sides against the x axis is
            // 45 degrees, 1/sin(45) = 1.4142 / 2 = 0.7071 ( / 2 allows for
            // only half the strokewidth is processed ). Or 0.9862 for thin diamond.
            // Note these values and the tk variable below are dependent, update
            // both together (saves trig hard coding it).
            var swFactor = (type == ArrowStyle.Diamond) ? 0.7071 : 0.9862;
            var endOffsetX = unitX * sw * swFactor;
            var endOffsetY = unitY * sw * swFactor;

            unitX = unitX * (size + sw);
            unitY = unitY * (size + sw);

            var pt = pe.clone();
            pt.x -= endOffsetX;
            pt.y -= endOffsetY;

            pe.x += -unitX - endOffsetX;
            pe.y += -unitY - endOffsetY;

            // thickness factor for diamond
            var tk = ((type == ArrowStyle.Diamond) ? 2 : 3.4);

            return () => {
                canvas.begin();
                canvas.moveTo(pt.x, pt.y);
                canvas.lineTo(pt.x - unitX / 2 - unitY / tk, pt.y + unitX / tk - unitY / 2);
                canvas.lineTo(pt.x - unitX, pt.y - unitY);
                canvas.lineTo(pt.x - unitX / 2 + unitY / tk, pt.y - unitY / 2 - unitX / tk);
                canvas.close();

                if (filled) {
                    canvas.fillAndStroke();
                } else {
                    canvas.stroke();
                }
            }
        }

        static register() {
            Marker.addMarker("classic", Marker.arrow);
            Marker.addMarker("block", Marker.arrow);
            Marker.addMarker("open", Marker.open);
            Marker.addMarker("oval", Marker.oval);
            Marker.addMarker("diamond", Marker.diamond);
            Marker.addMarker("diamondThin", Marker.diamond);
        }
    }

    Marker.register();
}