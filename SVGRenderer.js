/* A skeleton of this file was written by Duncan Levear in Spring 2023 for CS3333 at Boston College */

export class SVGRenderer {
    constructor(sceneInfo, image) {
        this.scene = sceneInfo;
        this.image = image;
        // clear image all white
        for (let i = 0; i < image.data.length; i++) {
            image.data[i] = 255;
        }
    }

    // I basically copied down putPixel and made modifications for the appearance/transparency of the colors here
    blendPixel(row, col, r, g, b, alpha, strokeWidth = 0) {
        if (!Number.isInteger(row) || !Number.isInteger(col)) {
          console.error("Cannot put pixel in fractional row/col");
          return;
        }
    
        if (row < 0 || row >= this.image.height || col < 0 || col >= this.image.width) {
          return;
        }
    
        const index = 4 * (this.image.width * row + col);
        const bgR = this.image.data[index + 0];
        const bgG = this.image.data[index + 1];
        const bgB = this.image.data[index + 2];
        this.image.data[index + 3] = 255;
    
        // Borrowed from here where percentage is alpha: https://coderwall.com/p/z8uxzw/javascript-color-blender
        const blendR = alpha * r + (1 - alpha) * bgR;
        const blendG = alpha * g + (1 - alpha) * bgG;
        const blendB = alpha * b + (1 - alpha) * bgB;
    
        this.image.data[index + 0] = Math.round(blendR);
        this.image.data[index + 1] = Math.round(blendG);
        this.image.data[index + 2] = Math.round(blendB);
        this.image.data[index + 3] = 255;
    }

    path(e) {
        const pathCommands = e.d.split(/(?=[LMQ])/);
        let currentPoint = [0, 0];
        let lastControlPoint = null;
      
        pathCommands.forEach((command) => {
          const type = command[0];
          const args = command.slice(1).trim().split(/[\s,]+/).map(parseFloat);
      
          switch (type) {
            case 'M': {
              currentPoint = [args[0], args[1]];
              break;
            }
            case 'L': {
                const endPoint = [args[0], args[1]];
                this.drawLine(currentPoint[0], currentPoint[1], endPoint[0], endPoint[1], parseRGB(e.stroke), e['stroke-opacity'] || 1, e.strokeWidth);
                currentPoint = endPoint; // update current point to be the same as end point
                break;
            }

            case 'Q': {
              const controlPoint = [args[0], args[1]];
              const endPoint = [args[2], args[3]];
              this.drawQuadraticBezierCurve(currentPoint[0], currentPoint[1], controlPoint[0], controlPoint[1], endPoint[0], endPoint[1], parseRGB(e.stroke), e['stroke-opacity'] || 1, e.strokeWidth);
              lastControlPoint = controlPoint;
              currentPoint = endPoint;
              break;
            }
            case 'T': {
                const endPoint = [args[0], args[1]];
                let controlPoint;
                if (lastControlPoint) {
                  // Reflect the previous control point across the current point to get the new control point
                  const dx = currentPoint[0] - lastControlPoint[0];
                  const dy = currentPoint[1] - lastControlPoint[1];
                  controlPoint = [currentPoint[0] + dx, currentPoint[1] + dy];
                } else {
                  // If there's no previous control point, use the current point as the control point
                  controlPoint = currentPoint;
                }
                this.drawQuadraticBezierCurve(currentPoint[0], currentPoint[1], controlPoint[0], controlPoint[1], endPoint[0], endPoint[1], parseRGB(e.stroke), e['stroke-opacity'] || 1, e.strokeWidth);
                lastControlPoint = controlPoint;
                currentPoint = endPoint;
                break;
            }
            case 'Z':
              // Close path by connecting the current point to the starting point
              if (lastControlPoint) {
                this.drawQuadraticBezierCurve(currentPoint[0], currentPoint[1], lastControlPoint[0], lastControlPoint[1], args[0], args[1], parseRGB(e.stroke), e['stroke-opacity'] || 1, e.strokeWidth);
              } else {
                this.drawLine(currentPoint[0], currentPoint[1], args[0], args[1], parseRGB(e.stroke), e['stroke-opacity'] || 1, e.strokeWidth);
              }
              currentPoint = [args[0], args[1]];
              lastControlPoint = null;
              break;
          }
        });
    }

    drawQuadraticBezierCurve(x0, y0, x1, y1, x2, y2, color, alpha, strokeWidth = 1) {
        const t_step = 0.001; // Step size for t, smaller means more precision
        let prev_x = x0;
        let prev_y = y0;
        for (let t = t_step; t <= 1; t += t_step) {
          // Calculate the x and y coordinates at this value of t
          const x = (1 - t) ** 2 * x0 + 2 * (1 - t) * t * x1 + t ** 2 * x2;
          const y = (1 - t) ** 2 * y0 + 2 * (1 - t) * t * y1 + t ** 2 * y2;
          // Draw a line from the previous point to this point
          this.drawLine(Math.round(prev_x), Math.round(prev_y), Math.round(x), Math.round(y), color, alpha, strokeWidth);
          prev_x = x;
          prev_y = y;
        }
    }


    circle(e) {
        // Parse the x, y and radius properties of the circle element
        const cx = parseFloat(e.cx);
        const cy = parseFloat(e.cy);
        const r = parseFloat(e.r);
      
        // Parse the fill color of the circle element and convert it to RGB format
        const color_a = parseRGB(e.fill);
      
        // Parse the fill opacity of the circle element, if it exists
        let fill_opacity = 1;
        if (e.fill_opacity) {
          fill_opacity = parseFloat(e.fill_opacity);
        }
      
        // Parse the stroke opacity of the circle element, if it exists
        let stroke_opacity = 1;
        if (e.stroke_opacity) {
          stroke_opacity = parseFloat(e.stroke_opacity);
        }
      
        // Initialize variables for the circle drawing algorithm
        let x = r - 1;
        let y = 0;
        let dx = 1;
        let dy = 1;
        let err = dx - (r * 2);
      
        // Loop through each pixel of the circle and blend the color onto the canvas
        while (x >= y) {

            for (let i = cy - y; i <= cy + y; i++) {
                this.blendPixel(i, cx + x, color_a[0], color_a[1], color_a[2], fill_opacity);
                this.blendPixel(i, cx - x, color_a[0], color_a[1], color_a[2], fill_opacity);
            }

            for (let i = cy - x; i <= cy + x; i++) {
                this.blendPixel(i, cx + y, color_a[0], color_a[1], color_a[2], fill_opacity);
                this.blendPixel(i, cx - y, color_a[0], color_a[1], color_a[2], fill_opacity);
            }
      
            // Increment or decrement x and y based on the circle drawing algorithm
            if (err <= 0) {
                y++;
                err += dy;
                dy += 2;
            }
        
            if (err > 0) {
                x--;
                dx += 2;
                err += dx - (r * 2);
            }
        }
      
        // If the circle has a stroke, draw the stroke onto the canvas
        if (e.stroke) {
            const stroke_color = parseRGB(e.stroke);
      
            // Loop through each degree of the circle and draw a line from the outer edge to the center
            for (let i = 0; i < 360; i += 0.5) {

                const x = cx + r * Math.cos(i * Math.PI / 180);
                const y = cy + r * Math.sin(i * Math.PI / 180);
                const [y0, x0] = this.closestPixelTo(x, y);
                const [y1, x1] = this.closestPixelTo(cx, cy);
                this.drawLine(x0, y0, x1, y1, stroke_color, stroke_opacity);
            }
        }
    }

    polygon(e) {

        const points = parsePoints(e.points);
        const triangles = triangulate(points);
        const color_a = parseRGB(e.fill)
        const stroke_color = parseRGB(e.stroke)
         
            
                
        if (e['fill-opacity'] >= 0) {
            var fill_opacity = e['fill-opacity']
        } else {
            var fill_opacity = 1            
        }
                
                
        if (e['stroke-opacity'] >= 0) {
            var stroke_opacity = e['stroke-opacity']         
        } else {
            var stroke_opacity = 1
        }
                              
        
        
        for (const [tri, triangle] of triangles.entries()) {

            let [x0, y0] = triangle[0];
            let [x1, y1] = triangle[1];
            let [x2, y2] = triangle[2];
            
            if (y1 < y0) {
                [x0, y0, x1, y1] = [x1, y1, x0, y0];
            }
            
            if (y2 < y0) {
                [x0, y0, x2, y2] = [x2, y2, x0, y0];
            }
            
            if (y2 < y1) {
                [x1, y1, x2, y2] = [x2, y2, x1, y1];
            }
            
            [y0, x0] = this.closestPixelTo(x0, y0);
            [y1, x1] = this.closestPixelTo(x1, y1);
            [y2, x2] = this.closestPixelTo(x2, y2);

            
            const e1  = this.lerp(y0, x0, y1, x1);
            const e2 = this.lerp(y1, x1, y2, x2);
            const e3 = this.lerp(y0, x0, y2, x2);
            
            e1.pop();
            const edge = [...e1, ...e2];
            
            const t = Math.floor(e3.length / 2);
            const [x_left, x_right] = e3[t] < edge[t] ? [e3, edge] : [edge, e3];
            
            for (let y = y0; y < y2; y++) {
                let xStart = x_left[y - y0];
                let xEnd = x_right[y - y0];
            
                for (let x = xStart; x < xEnd; x++) {
                    this.blendPixel(y, x, color_a[0], color_a[1], color_a[2], fill_opacity);
                }
            }     
        }
                 
        for (let i = 0; i < points.length - 1; i++) {
            let startPoint = points[i];
            let endPoint = points[i + 1];
            
            this.drawLine(startPoint[0], startPoint[1], endPoint[0], endPoint[1], stroke_color, stroke_opacity);
        }
        
        let firstPoint = points[0];
        let lastPoint = points[points.length - 1];
        
        this.drawLine(firstPoint[0], firstPoint[1], lastPoint[0], lastPoint[1], stroke_color, stroke_opacity);
    }        

    putPixel(row, col, r, g, b) { 
        /*
        Update one pixel in the image array. (r,g,b) are 0-255 color values.
        */
        if (Math.round(row) != row) {
            console.error("Cannot put pixel in fractional row");
            return;
        }
        if (Math.round(col) != col) {
            console.error("Cannot put pixel in fractional col");
            return;
        }
        if (row < 0 || row >= this.image.height) {
            return;
        }
        if (col < 0 || col >= this.image.width) {
            return;
        }

        const index = 4 * (this.image.width * row + col);
        this.image.data[index + 0] = Math.round(r);
        this.image.data[index + 1] = Math.round(g);
        this.image.data[index + 2] = Math.round(b);
        this.image.data[index + 3] = 255;
        
    }

    closestPixelTo(x, y) {
        const [minX, minY, globalWidth, globalHeight] = this.scene.viewBox.split(" ").map(Number);
        const colWidth = (this.scene.width - 1) / globalWidth;
        const rowHeight = (this.scene.height - 1) / globalHeight;
      
        const pixelX = (y * rowHeight) - (minY * rowHeight);
        const pixelY = (x * colWidth) - (minX * colWidth);
      
        return [pixelX, pixelY];
    }

    lerp (i0, d0, i1, d1) {

        // rise over run
        let slope = (d1 - d0) / (i1 - i0);
        const values = [];
        let d = d0;

        for (let i = i0; i <= i1; i++) {
            values.push(Math.round(d));
            d = d + slope;
        }

        return values;
    }


    drawLine(x0, y0, x1, y1, color, alpha = 1) { 
        if (typeof(alpha) == "undefined") {
            alpha = 1
        }

        const new_first = this.closestPixelTo(x0,y0)
        y0 = new_first[0]
        x0 = new_first[1]
        const new_second = this.closestPixelTo(x1,y1)
        y1 = new_second[0]
        x1 = new_second[1]
        
        var [r,g,b] = (color)
  
        if (Math.abs(x1 - x0) > Math.abs(y1 - y0)) {
            // Line is horizontal-ish
            // Make sure x0 < x1
            if (x0 > x1) {
                const old_x0 = x0
                const old_y0 = y0
                x0 = x1
                x1 = old_x0
                y0 = y1
                y1 = old_y0
              
            }

            var ys = this.lerp(x0, y0, x1, y1)
            for (var i = 0; i < ys.length; i++) {
                this.blendPixel(Math.round((ys[i])), Math.round(x0+i), r, g, b, alpha)
            }
            
        } else {
            // Line is vertical-ish
            // Make sure y0 < y1
            if (y0 > y1) {
                const old_x0 = x0
                const old_y0 = y0
                x0 = x1
                x1 = old_x0
                y0 = y1
                y1 = old_y0
            }

            var xs = this.lerp(y0, x0, y1, x1)

            for (var i = 0; i < xs.length; i++) {
                this.blendPixel(Math.round(y0+i), Math.round(xs[i]), r,g,b, alpha )
            }
        }
    }

    render() {
        /*
        Put all the pixels to light up the elements in scene.elements. 
        It will be necessary to parse the attributes of scene.elements, e.g. converting from stings to numbers.
        */
        for (const e of this.scene.elements) {

            if (e.type === 'point') {

                const x = Number(e.x);
                const y = Number(e.y);
                const color = parseRGB(e.color);
                const alpha = Number(e.opacity) || 1;
                const [row, col] = this.closestPixelTo(x, y);
                this.putPixel(row, col, color[0], color[1], color[2], alpha);

            } else if (e.type === 'line') {

                const x0 = Number(e.x1)
                const y0 = Number(e.y1)
                const x1 = Number(e.x2)
                const y1 = Number(e.y2)
                
                const color = parseRGB(e.stroke)
                
                this.drawLine(x0, y0, x1, y1, color)
                
            } else if (e.type === 'polyline') {

                const color = parseRGB(e.stroke);
                const points = parsePoints(e.points);

                for (let i = 0; i < points.length - 1; i++) {
                    const [x0, y0] = points[i];
                    const [x1, y1] = points[i + 1];
                    this.drawLine(x0, y0, x1, y1, color);
                }
            } else if (e.type === 'polygon') {
                this.polygon(e);
                
            } else if (e.type === 'circle') {
                console.log("rendering circle");
                this.circle(e);

            } else if (e.type === 'path') {
                this.path(e);
            }
        }
    }
}

function parseRGB(colorString) {
    /*
    Return arguments as array [r,g,b] from string ilke "rgb(255, 0, 127)".
    */
    if (colorString === undefined) {
        // Default value for all colors
        return [0, 0, 0];
    }
    if (colorString[0] === "#") {
        const r = parseInt(colorString[1] + colorString[2], 16);
        const g = parseInt(colorString[3] + colorString[4], 16);
        const b = parseInt(colorString[5] + colorString[6], 16);
        return [r,g,b];
    }
    const parsed = colorString.match(/rgb\(( *\d* *),( *\d* *),( *\d* *)\)/);
    if (parsed.length !== 4) {
        console.error(`Could not parse color string ${colorString}`);
        return [0, 0, 0];
    }
    return [Number(parsed[1]), Number(parsed[2]), Number(parsed[3])];
}

function triangulate(points) {
    /*
    Return an array of triangles whose union equals the polygon described by points.
    Assume that points is an array of pairs of numbers. No coordinate transforms are applied.
    Assume that the polygon is non self-intersecting.
    */
    if (points.length <= 3) {
        return [points];
    } else if (points.length === 4) {
        // rearrange into CCW order with points[0] having greatest internal angle
        function f(u,v) {
            // angle between points u and v as if v were the origin
            const ret = Math.atan2(u[1]-v[1],u[0]-v[0]);
            return ret;
        }
        function angleAt(k) {
            const v = points[k];
            const u = points[(k-1+4) % 4];
            const w = points[(k+1) % 4];
            let a = f(w,v) - f(u,v);
            if ( a < 0) {
                return a + 2*Math.PI;
            }
            return a;
        };
        const angles = [angleAt(0), angleAt(1), angleAt(2), angleAt(3)];
        // Check for CCW order
        if (angles[0] + angles[1] + angles[2] + angles[3] > 4*Math.PI) {
            return triangulate([points[3], points[2],points[1],points[0]]);
        }
        // Check for points[0] greatest internal angle
        if (angles[0] !== Math.max(...angles)) {
            return triangulate([points[1], points[2], points[3], points[0]]);
        }
        // If so, the following triangulation is correct
        return [[points[0],points[1],points[2]],[points[0],points[2],points[3]]];
        
   
    } else {
        console.error("Only 3-polygons and 4-polygons supported");
    }
}

function parsePoints(points) {
    /*
    Helper method: convert string like "5,7 100,-2" to array [[5,7], [100,-2]]
    */
    const ret = [];
    const pairs = points.split(" ");
    for (const pair of pairs) {
        if (pair !== "") {
            const [x, y] = pair.split(",");
            ret.push([Number(x), Number(y)]);
        }
    }
    return ret;
}







        

