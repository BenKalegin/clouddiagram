module Five {

    export interface IPerimeterStyle {
        (bounds: Rectangle, vertex: CellState, next: Point, orthogonal: boolean): Point;
    }

    /**
    * Provides various perimeter functions to be used in a style
    * as the value of <Constants.STYLE_PERIMETER>. Perimeters for
    * rectangle, circle, rhombus and triangle are available.
    *
    * Example:
    * 
    * (code)
    * <add as="perimeter">mxPerimeter.RightAngleRectanglePerimeter</add>
    * (end)
    * 
    * Or programmatically:
    * 
    * (code)
    * style[Constants.STYLE_PERIMETER] = mxPerimeter.RectanglePerimeter;
    * (end)
    * 
    * When adding new perimeter functions, it is recommended to use the 
    * mxPerimeter-namespace as follows:
    * 
    * (code)
    * mxPerimeter.CustomPerimeter = function (bounds, vertex, next, orthogonal)
    * {
    *   var x = 0; // Calculate x-coordinate
    *   var y = 0; // Calculate y-coordainte
    *   
    *   return new Point(x, y);
    * }
    * (end)
    * 
    * The new perimeter should then be registered in the <mxStyleRegistry> as follows:
    * (code)
    * mxStyleRegistry.putValue('customPerimeter', mxPerimeter.CustomPerimeter);
    * (end)
    * 
    * The custom perimeter above can now be used in a specific vertex as follows:
    * 
    * (code)
    * model.setStyle(vertex, 'perimeter=customPerimeter');
    * (end)
    * 
    * Note that the key of the <mxStyleRegistry> entry for the function should
    * be used in string values, unless <mxGraphView.allowEval> is true, in
    * which case you can also use mxPerimeter.CustomPerimeter for the value in
    * the cell style above.
    * 
    * Or it can be used for all vertices in the graph as follows:
    * 
    * (code)
    * var style = graph.getStylesheet().getDefaultVertexStyle();
    * style[Constants.STYLE_PERIMETER] = mxPerimeter.CustomPerimeter;
    * (end)
    * 
    * Note that the object can be used directly when programmatically setting
    * the value, but the key in the <mxStyleRegistry> should be used when
    * setting the value via a key, value pair in a cell style.
    * 
    * The parameters are explained in <RectanglePerimeter>.
    */
    export class Perimeter {


        static rectanglePerimeter(bounds: Rectangle, vertex: CellState, next: Point, orthogonal: boolean) {
            /// <summary>Describes a rectangular perimeter for the given bounds</summary>
            /// <param name="bounds">Rectangle that represents the absolute bounds of the vertex</param>
            /// <param name="vertex">CellState that represents the vertex</param>
            /// <param name="next">Point that represents the nearest neighbour point on the given edge</param>
            /// <param name="orthogonal">Boolean that specifies if the orthogonal projection onto the perimeter should be returned. 
            /// If this is false then the intersection of the perimeter and the line between the next and the center point is returned.</param>
            var cx = bounds.getCenterX();
            var cy = bounds.getCenterY();
            var dx = next.x - cx;
            var dy = next.y - cy;
            var alpha = Math.atan2(dy, dx);
            var p = new Point(0, 0);
            var pi = Math.PI;
            var pi2 = Math.PI / 2;
            var beta = pi2 - alpha;
            var t = Math.atan2(bounds.height, bounds.width);

            if (alpha < -pi + t || alpha > pi - t) {
                // Left edge
                p.x = bounds.x;
                p.y = cy - bounds.width * Math.tan(alpha) / 2;
            } else if (alpha < -t) {
                // Top Edge
                p.y = bounds.y;
                p.x = cx - bounds.height * Math.tan(beta) / 2;
            } else if (alpha < t) {
                // Right Edge
                p.x = bounds.x + bounds.width;
                p.y = cy + bounds.width * Math.tan(alpha) / 2;
            } else {
                // Bottom Edge
                p.y = bounds.y + bounds.height;
                p.x = cx + bounds.height * Math.tan(beta) / 2;
            }

            if (orthogonal) {
                if (next.x >= bounds.x &&
                    next.x <= bounds.x + bounds.width) {
                    p.x = next.x;
                } else if (next.y >= bounds.y &&
                    next.y <= bounds.y + bounds.height) {
                    p.y = next.y;
                }
                if (next.x < bounds.x) {
                    p.x = bounds.x;
                } else if (next.x > bounds.x + bounds.width) {
                    p.x = bounds.x + bounds.width;
                }
                if (next.y < bounds.y) {
                    p.y = bounds.y;
                } else if (next.y > bounds.y + bounds.height) {
                    p.y = bounds.y + bounds.height;
                }
            }

            return p;
        }

        static ellipsePerimeter(bounds: Rectangle, vertex: CellState, next: Point, orthogonal: boolean) {
            var x = bounds.x;
            var y = bounds.y;
            var a = bounds.width / 2;
            var b = bounds.height / 2;
            var cx = x + a;
            var cy = y + b;
            var px = next.x;
            var py = next.y;

            // Calculates straight line equation through
            // point and ellipse center y = d * x + h
            var dx = px - cx;
            var dy = py - cy;

            if (dx === 0 && dy !== 0) {
                return new Point(cx, cy + b * dy / Math.abs(dy));
            } else if (dx == 0 && dy == 0) {
                return new Point(px, py);
            }

            if (orthogonal) {
                var ty: number;
                var tx: number;
                if (py >= y && py <= y + bounds.height) {
                    ty = py - cy;
                    tx = Math.sqrt(a * a * (1 - (ty * ty) / (b * b))) || 0;
                    if (px <= x) {
                        tx = -tx;
                    }

                    return new Point(cx + tx, py);
                }

                if (px >= x && px <= x + bounds.width) {
                    tx = px - cx;
                    ty = Math.sqrt(b * b * (1 - (tx * tx) / (a * a))) || 0;
                    if (py <= y) {
                        ty = -ty;
                    }

                    return new Point(px, cy + ty);
                }
            }

            // prevent division by nearly zero
            var epsilon = 0.01;
            if (Math.abs(dx) < epsilon)
                dx = dx < 0 ? -epsilon : epsilon;
            // Calculates intersection
            var d = dy / dx;
            var h = cy - d * cx;
            var e = a * a * d * d + b * b;
            var f = -2 * cx * e;
            var g = a * a * d * d * cx * cx +
                b * b * cx * cx -
                a * a * b * b;
            var det = Math.sqrt(f * f - 4 * e * g);

            // Two solutions (perimeter points)
            var xout1 = (-f + det) / (2 * e);
            var xout2 = (-f - det) / (2 * e);
            var yout1 = d * xout1 + h;
            var yout2 = d * xout2 + h;
            var dist1 = Math.sqrt(Math.pow((xout1 - px), 2)
                + Math.pow((yout1 - py), 2));
            var dist2 = Math.sqrt(Math.pow((xout2 - px), 2)
                + Math.pow((yout2 - py), 2));

            // Correct solution
            var xout = 0;
            var yout = 0;

            if (dist1 < dist2) {
                xout = xout1;
                yout = yout1;
            } else {
                xout = xout2;
                yout = yout2;
            }

            return new Point(xout, yout);
        }

        static rhombusPerimeter(bounds: Rectangle, vertex: CellState, next: Point, orthogonal: boolean) {
            var x = bounds.x;
            var y = bounds.y;
            var w = bounds.width;
            var h = bounds.height;

            var cx = x + w / 2;
            var cy = y + h / 2;

            var px = next.x;
            var py = next.y;

            // Special case for intersecting the diamond's corners
            if (cx == px) {
                if (cy > py) {
                    return new Point(cx, y); // top
                } else {
                    return new Point(cx, y + h); // bottom
                }
            } else if (cy == py) {
                if (cx > px) {
                    return new Point(x, cy); // left
                } else {
                    return new Point(x + w, cy); // right
                }
            }

            var tx = cx;
            var ty = cy;

            if (orthogonal) {
                if (px >= x && px <= x + w) {
                    tx = px;
                } else if (py >= y && py <= y + h) {
                    ty = py;
                }
            }

            // In which quadrant will the intersection be?
            // set the slope and offset of the border line accordingly
            if (px < cx) {
                if (py < cy) {
                    return Utils.intersection(px, py, tx, ty, cx, y, x, cy);
                } else {
                    return Utils.intersection(px, py, tx, ty, cx, y + h, x, cy);
                }
            } else if (py < cy) {
                return Utils.intersection(px, py, tx, ty, cx, y, x + w, cy);
            } else {
                return Utils.intersection(px, py, tx, ty, cx, y + h, x + w, cy);
            }
        }

        static trianglePerimeter(bounds: Rectangle, vertex: CellState, next: Point, orthogonal: boolean) {
            var direction: Direction = null;
            if (vertex != null) {
                direction = vertex.style.direction;
            }
            var vertical = direction == Direction.North || direction == Direction.South;

            var x = bounds.x;
            var y = bounds.y;
            var w = bounds.width;
            var h = bounds.height;

            var cx = x + w / 2;
            var cy = y + h / 2;

            var start: Point;
            var corner: Point;
            var end: Point;

            switch (direction) {
            case Direction.East:
                start = new Point(x, y);
                corner = new Point(x + w, cy);
                end = new Point(x, y + h);
                break;
            case Direction.North:
                start = end;
                corner = new Point(cx, y);
                end = new Point(x + w, y + h);
                break;
            case Direction.South:
                corner = new Point(cx, y + h);
                end = new Point(x + w, y);
                break;
            case Direction.West:
                start = new Point(x + w, y);
                corner = new Point(x, cy);
                end = new Point(x + w, y + h);
                break;
            }

            var dx = next.x - cx;
            var dy = next.y - cy;

            var alpha = (vertical) ? Math.atan2(dx, dy) : Math.atan2(dy, dx);
            var t = (vertical) ? Math.atan2(w, h) : Math.atan2(h, w);

            var base = false;

            if (direction == Direction.North || direction == Direction.West) {
                base = alpha > -t && alpha < t;
            } else {
                base = alpha < -Math.PI + t || alpha > Math.PI - t;
            }

            var result = null;

            if (base) {
                if (orthogonal && ((vertical && next.x >= start.x && next.x <= end.x) ||
                (!vertical && next.y >= start.y && next.y <= end.y))) {
                    if (vertical) {
                        result = new Point(next.x, start.y);
                    } else {
                        result = new Point(start.x, next.y);
                    }
                } else {
                    switch (direction) {
                    case Direction.North:
                        result = new Point(x + w / 2 + h * Math.tan(alpha) / 2,
                            y + h);
                        break;
                    case Direction.South:
                        result = new Point(x + w / 2 - h * Math.tan(alpha) / 2,
                            y);
                        break;
                    case Direction.West:
                        result = new Point(x + w, y + h / 2 + w * Math.tan(alpha) / 2);
                        break;
                    case Direction.East:
                        result = new Point(x, y + h / 2 - w * Math.tan(alpha) / 2);
                        break;
                    }
                }
            } else {
                if (orthogonal) {
                    var pt = new Point(cx, cy);

                    if (next.y >= y && next.y <= y + h) {
                        pt.x = (vertical) ? cx : (direction == Direction.West) ? x + w : x;
                        pt.y = next.y;
                    } else if (next.x >= x && next.x <= x + w) {
                        pt.x = next.x;
                        pt.y = (!vertical) ? cy : ((direction == Direction.North) ? y + h : y);
                    }

                    // Compute angle
                    dx = next.x - pt.x;
                    dy = next.y - pt.y;

                    cx = pt.x;
                    cy = pt.y;
                }

                if ((vertical && next.x <= x + w / 2) ||
                (!vertical && next.y <= y + h / 2)) {
                    result = Utils.intersection(next.x, next.y, cx, cy,
                        start.x, start.y, corner.x, corner.y);
                } else {
                    result = Utils.intersection(next.x, next.y, cx, cy,
                        corner.x, corner.y, end.x, end.y);
                }
            }

            if (result == null) {
                result = new Point(cx, cy);
            }

            return result;
        }

        static hexagonPerimeter(bounds: Rectangle, vertex: CellState, next: Point, orthogonal: boolean) {
            var x = bounds.x;
            var y = bounds.y;
            var w = bounds.width;
            var h = bounds.height;

            var cx = bounds.getCenterX();
            var cy = bounds.getCenterY();
            var px = next.x;
            var py = next.y;
            var dx = px - cx;
            var dy = py - cy;
            var alpha = -Math.atan2(dy, dx);
            var pi = Math.PI;
            var pi2 = Math.PI / 2;

            var result = new Point(cx, cy);

            var direction = (vertex != null) ? vertex.style.direction || Direction.East : Direction.East;
            var vertical = direction.valueOf() == Direction.North || direction == Direction.South;
            var a = new Point();
            var b = new Point();

            //Only consider corrects quadrants for the orthogonal case.
            if ((px < x) && (py < y) || (px < x) && (py > y + h)
                || (px > x + w) && (py < y) || (px > x + w) && (py > y + h)) {
                orthogonal = false;
            }

            if (orthogonal) {
                if (vertical) {
                    //Special cases where intersects with hexagon corners
                    if (px == cx) {
                        if (py <= y) {
                            return new Point(cx, y);
                        } else if (py >= y + h) {
                            return new Point(cx, y + h);
                        }
                    } else if (px < x) {
                        if (py == y + h / 4) {
                            return new Point(x, y + h / 4);
                        } else if (py == y + 3 * h / 4) {
                            return new Point(x, y + 3 * h / 4);
                        }
                    } else if (px > x + w) {
                        if (py == y + h / 4) {
                            return new Point(x + w, y + h / 4);
                        } else if (py == y + 3 * h / 4) {
                            return new Point(x + w, y + 3 * h / 4);
                        }
                    } else if (px == x) {
                        if (py < cy) {
                            return new Point(x, y + h / 4);
                        } else if (py > cy) {
                            return new Point(x, y + 3 * h / 4);
                        }
                    } else if (px == x + w) {
                        if (py < cy) {
                            return new Point(x + w, y + h / 4);
                        } else if (py > cy) {
                            return new Point(x + w, y + 3 * h / 4);
                        }
                    }
                    if (py == y) {
                        return new Point(cx, y);
                    } else if (py == y + h) {
                        return new Point(cx, y + h);
                    }

                    if (px < cx) {
                        if ((py > y + h / 4) && (py < y + 3 * h / 4)) {
                            a = new Point(x, y);
                            b = new Point(x, y + h);
                        } else if (py < y + h / 4) {
                            a = new Point(x - Math.floor(0.5 * w), y
                                + Math.floor(0.5 * h));
                            b = new Point(x + w, y - Math.floor(0.25 * h));
                        } else if (py > y + 3 * h / 4) {
                            a = new Point(x - Math.floor(0.5 * w), y
                                + Math.floor(0.5 * h));
                            b = new Point(x + w, y + Math.floor(1.25 * h));
                        }
                    } else if (px > cx) {
                        if ((py > y + h / 4) && (py < y + 3 * h / 4)) {
                            a = new Point(x + w, y);
                            b = new Point(x + w, y + h);
                        } else if (py < y + h / 4) {
                            a = new Point(x, y - Math.floor(0.25 * h));
                            b = new Point(x + Math.floor(1.5 * w), y
                                + Math.floor(0.5 * h));
                        } else if (py > y + 3 * h / 4) {
                            a = new Point(x + Math.floor(1.5 * w), y
                                + Math.floor(0.5 * h));
                            b = new Point(x, y + Math.floor(1.25 * h));
                        }
                    }

                } else {
                    //Special cases where intersects with hexagon corners
                    if (py == cy) {
                        if (px <= x) {
                            return new Point(x, y + h / 2);
                        } else if (px >= x + w) {
                            return new Point(x + w, y + h / 2);
                        }
                    } else if (py < y) {
                        if (px == x + w / 4) {
                            return new Point(x + w / 4, y);
                        } else if (px == x + 3 * w / 4) {
                            return new Point(x + 3 * w / 4, y);
                        }
                    } else if (py > y + h) {
                        if (px == x + w / 4) {
                            return new Point(x + w / 4, y + h);
                        } else if (px == x + 3 * w / 4) {
                            return new Point(x + 3 * w / 4, y + h);
                        }
                    } else if (py == y) {
                        if (px < cx) {
                            return new Point(x + w / 4, y);
                        } else if (px > cx) {
                            return new Point(x + 3 * w / 4, y);
                        }
                    } else if (py == y + h) {
                        if (px < cx) {
                            return new Point(x + w / 4, y + h);
                        } else if (py > cy) {
                            return new Point(x + 3 * w / 4, y + h);
                        }
                    }
                    if (px == x) {
                        return new Point(x, cy);
                    } else if (px == x + w) {
                        return new Point(x + w, cy);
                    }

                    if (py < cy) {
                        if ((px > x + w / 4) && (px < x + 3 * w / 4)) {
                            a = new Point(x, y);
                            b = new Point(x + w, y);
                        } else if (px < x + w / 4) {
                            a = new Point(x - Math.floor(0.25 * w), y + h);
                            b = new Point(x + Math.floor(0.5 * w), y
                                - Math.floor(0.5 * h));
                        } else if (px > x + 3 * w / 4) {
                            a = new Point(x + Math.floor(0.5 * w), y
                                - Math.floor(0.5 * h));
                            b = new Point(x + Math.floor(1.25 * w), y + h);
                        }
                    } else if (py > cy) {
                        if ((px > x + w / 4) && (px < x + 3 * w / 4)) {
                            a = new Point(x, y + h);
                            b = new Point(x + w, y + h);
                        } else if (px < x + w / 4) {
                            a = new Point(x - Math.floor(0.25 * w), y);
                            b = new Point(x + Math.floor(0.5 * w), y
                                + Math.floor(1.5 * h));
                        } else if (px > x + 3 * w / 4) {
                            a = new Point(x + Math.floor(0.5 * w), y
                                + Math.floor(1.5 * h));
                            b = new Point(x + Math.floor(1.25 * w), y);
                        }
                    }
                }

                var tx = cx;
                var ty = cy;

                if (px >= x && px <= x + w) {
                    tx = px;

                    if (py < cy) {
                        ty = y + h;
                    } else {
                        ty = y;
                    }
                } else if (py >= y && py <= y + h) {
                    ty = py;

                    if (px < cx) {
                        tx = x + w;
                    } else {
                        tx = x;
                    }
                }

                result = Utils.intersection(tx, ty, next.x, next.y, a.x, a.y, b.x, b.y);
            } else {
                var beta: number;
                if (vertical) {
                    beta = Math.atan2(h / 4, w / 2); //Special cases where intersects with hexagon corners
                    if (alpha == beta) {
                        return new Point(x + w, y + Math.floor(0.25 * h));
                    } else if (alpha == pi2) {
                        return new Point(x + Math.floor(0.5 * w), y);
                    } else if (alpha == (pi - beta)) {
                        return new Point(x, y + Math.floor(0.25 * h));
                    } else if (alpha == -beta) {
                        return new Point(x + w, y + Math.floor(0.75 * h));
                    } else if (alpha == (-pi2)) {
                        return new Point(x + Math.floor(0.5 * w), y + h);
                    } else if (alpha == (-pi + beta)) {
                        return new Point(x, y + Math.floor(0.75 * h));
                    }

                    if ((alpha < beta) && (alpha > -beta)) {
                        a = new Point(x + w, y);
                        b = new Point(x + w, y + h);
                    } else if ((alpha > beta) && (alpha < pi2)) {
                        a = new Point(x, y - Math.floor(0.25 * h));
                        b = new Point(x + Math.floor(1.5 * w), y
                            + Math.floor(0.5 * h));
                    } else if ((alpha > pi2) && (alpha < (pi - beta))) {
                        a = new Point(x - Math.floor(0.5 * w), y
                            + Math.floor(0.5 * h));
                        b = new Point(x + w, y - Math.floor(0.25 * h));
                    } else if (((alpha > (pi - beta)) && (alpha <= pi))
                        || ((alpha < (-pi + beta)) && (alpha >= -pi))) {
                        a = new Point(x, y);
                        b = new Point(x, y + h);
                    } else if ((alpha < -beta) && (alpha > -pi2)) {
                        a = new Point(x + Math.floor(1.5 * w), y
                            + Math.floor(0.5 * h));
                        b = new Point(x, y + Math.floor(1.25 * h));
                    } else if ((alpha < -pi2) && (alpha > (-pi + beta))) {
                        a = new Point(x - Math.floor(0.5 * w), y
                            + Math.floor(0.5 * h));
                        b = new Point(x + w, y + Math.floor(1.25 * h));
                    }
                } else {
                    beta = Math.atan2(h / 2, w / 4); //Special cases where intersects with hexagon corners
                    if (alpha == beta) {
                        return new Point(x + Math.floor(0.75 * w), y);
                    } else if (alpha == (pi - beta)) {
                        return new Point(x + Math.floor(0.25 * w), y);
                    } else if ((alpha == pi) || (alpha == -pi)) {
                        return new Point(x, y + Math.floor(0.5 * h));
                    } else if (alpha == 0) {
                        return new Point(x + w, y + Math.floor(0.5 * h));
                    } else if (alpha == -beta) {
                        return new Point(x + Math.floor(0.75 * w), y + h);
                    } else if (alpha == (-pi + beta)) {
                        return new Point(x + Math.floor(0.25 * w), y + h);
                    }

                    if ((alpha > 0) && (alpha < beta)) {
                        a = new Point(x + Math.floor(0.5 * w), y
                            - Math.floor(0.5 * h));
                        b = new Point(x + Math.floor(1.25 * w), y + h);
                    } else if ((alpha > beta) && (alpha < (pi - beta))) {
                        a = new Point(x, y);
                        b = new Point(x + w, y);
                    } else if ((alpha > (pi - beta)) && (alpha < pi)) {
                        a = new Point(x - Math.floor(0.25 * w), y + h);
                        b = new Point(x + Math.floor(0.5 * w), y
                            - Math.floor(0.5 * h));
                    } else if ((alpha < 0) && (alpha > -beta)) {
                        a = new Point(x + Math.floor(0.5 * w), y
                            + Math.floor(1.5 * h));
                        b = new Point(x + Math.floor(1.25 * w), y);
                    } else if ((alpha < -beta) && (alpha > (-pi + beta))) {
                        a = new Point(x, y + h);
                        b = new Point(x + w, y + h);
                    } else if ((alpha < (-pi + beta)) && (alpha > -pi)) {
                        a = new Point(x - Math.floor(0.25 * w), y);
                        b = new Point(x + Math.floor(0.5 * w), y
                            + Math.floor(1.5 * h));
                    }
                }

                result = Utils.intersection(cx, cy, next.x, next.y, a.x, a.y, b.x, b.y);
            }

            if (result == null) {
                return new Point(cx, cy);
            }

            return result;
        }
    }
}