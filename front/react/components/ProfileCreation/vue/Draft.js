import { Matrix } from 'transformation-matrix-js';
import p5 from 'p5';
// line: {
//   type: 0
//   p0: {x, y},
//   p1: {x, y}
// }

// arc: {
//   type: 1
//   c,
//   d,
//   from,
//   to
// }

export default class Draft {
  constructor() {
    this.sk = null;
    this.firstElementIndex = -1; // position of first element of import in input vectors
    this.collisionDetector = null;
    this.selectedElement = null; // element that selected by pressing the mouse
    this.hoveredElement = -1; // element under cursor
    this.draftTranformMatrix = new Matrix(); // tranformation matrix for center of draft
    this.transformMatrix = null; // matrix for transformations
    this.negativeRotateMatrix = null; // matrix for negative rotation
    this.rotateMatrix = null; // matrix for rotation
    this.currentZoom = { value: 1 };
    this.l = null;
    this.r = null;
    this.a = null;

    // current action
    this.isDrawing = false;
    this.isPanning = false;

    // panning
    this.panX = 0;
    this.panY = 0;
    this.tmpPanX = 0;
    this.tmpPanY = 0;
    this.panStart = null; // cursor pos when start panning

    // for drawing
    this.tmpEl = null;
    this.drawing = [];
    this.drawingDots = [];
    this.drawingCollisionMap = null;
    this.drawingAxisCenterHovered = -1;
    this.drawingAxisCenterSelected = -1;

    // for imported profile
    this.import = null;
    this.collisionMap = null;
    this.sizesPos = [];
    this.showDimensions = false;
    this.showNumbering = false;
    
  }

  findLinesIntersection(l1, l2) {
    let x1 = l1.p0.x;
    let y1 = l1.p0.y;
    let x2 = l1.p1.x;
    let y2 = l1.p1.y;
    let x3 = l2.p0.x;
    let y3 = l2.p0.y;
    let x4 = l2.p1.x;
    let y4 = l2.p1.y;
    return this.sk.createVector(((x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4)) / ((x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4)),
      ((x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4)) / ((x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4))
    );
  }

  findParallelLine(l, r, direction) {
    let parallel = p5.Vector.sub(l.p1, l.p0);
    let normal = p5.Vector.fromAngle(this.sk.radians(parallel.heading()) + direction * this.sk.HALF_PI, r);
    return {
      p0: p5.Vector.sub(l.p0, normal),
      p1: p5.Vector.sub(l.p1, normal),
      normal: this.sk.degrees(normal.heading())
    };
  }

  setRoundings() {
    let distances = this.drawing.map((el) => el.p0.dist(el.p1));
    let radius = Math.min(...distances) / 4; // raunding radius = min line length / 4
    let lastElIndex = (this.drawing.length * 2) - 2;

    for(let i = 0; i < lastElIndex - 1; i += 2) {
      let l1 = this.drawing[i];
      let l2 = this.drawing[i+1];
      let l1V = p5.Vector.sub(l1.p1, l1.p0);
      let l2V = p5.Vector.sub(l2.p1, l2.p0);
      let l1Angle = l1V.heading();
      let l2Angle = l2V.heading();
      let direction, l1p, l2p, c, from, to, cut;

      if(l1Angle === l2Angle || (180 - l1Angle) === l2Angle) {
        return;
      } else if((l2Angle < l1Angle && l2Angle > l1Angle - 180) || (l1Angle < 0 && l2Angle > 180 + l1Angle)) {
        direction = 1;
      } else {
        direction = -1;
      }
      l1p = this.findParallelLine(l1, radius, direction);
      l2p = this.findParallelLine(l2, radius, direction);
      c = this.findLinesIntersection(l1p, l2p);

      if(direction === -1) {
        from = l1p.normal;
        to = l2p.normal;
      } else {
        from = l2p.normal;
        to = l1p.normal;
      }

      cut = Math.sqrt(c.dist(l1.p1) ** 2 - radius ** 2);
      l1V.setMag(l1V.mag() - cut);
      l2V.setMag(l2V.mag() - cut);
      l1.p1 = p5.Vector.add(l1.p0, l1V);
      l2.p0 = p5.Vector.sub(l2.p1, l2V);

      this.drawing.splice(i + 1, 0, {
        type: 1,
        c,
        d: 2 * radius,
        from,
        to
      });
    }
    console.log(this.drawing);
  }

  render() {
    if (!!this.tmpEl) {
      let invertMatrix = this.draftTranformMatrix.clone()
        .translate(this.panX + this.tmpPanX, this.panY + this.tmpPanY)
        .scaleU(this.currentZoom.value).inverse();
      let { x, y } = invertMatrix.applyToPoint(this.sk.mouseX, this.sk.mouseY);
      this.sk.line(this.tmpEl.p0.x, this.tmpEl.p0.y, x, y);
    }


    // draw drawing proifle
    this.sk.noFill();
    for (let el of this.drawing) {
      if (el.type === 0) {
        this.sk.line(el.p0.x, el.p0.y, el.p1.x, el.p1.y);
      } else {
        this.sk.arc(el.c.x, el.c.y, el.d, el.d, el.from, el.to);
      }
    }
    // draw imported profile
    this.renderProfile();
    // draw profile information placeholders
    // for (let pos of this.sizesPos) {
    //   this.sk.ellipse(pos.x, pos.y, 10);
    // }
    // drawing points
    for (let i = 0; i < this.drawingDots.length; i++) {
      if (i === this.drawingAxisCenterHovered || i === this.drawingAxisCenterSelected.index / 0.5 - 2) {
        this.sk.fill(255);
      } else {
        this.sk.noFill();
      }
      this.sk.ellipse(this.drawingDots[i].x, this.drawingDots[i].y, 8);
    }

    this.renderProfileParams();
    this.renderProfileNumbers();

    //render collision map of drawing
    // this.renderDrawingCollisionMap();

    // render collision map
    // this.renderCollisionMap();
  }

  renderProfileParams() {
    if (this.import === null) {
      return;
    }
    if (this.showDimensions) {
      let flipMatrix = Matrix.from(1, 0, 0, -1, 0, 0);
      this.sk.textSize(12);
      this.sk.fill(255);
      this.sk.strokeWeight(1 / this.currentZoom.value);
      this.sk.applyMatrix(...flipMatrix.toArray());
      this.sk.applyMatrix(...this.rotateMatrix.toArray());
      let numberOfElements = this.import.elements.length;
      let rightPart = numberOfElements - this.firstElementIndex - 1;
      let elements = this.import.elements;
      for (let i = 0; i < this.sizesPos.length; i++) {
        let elIndex = i <= rightPart ? i + this.firstElementIndex : numberOfElements - i - 1;
        let { x, y } = flipMatrix.applyToPoint(this.sizesPos[i].x, this.sizesPos[i].y);
        let pos = this.negativeRotateMatrix.applyToPoint(x, y);
        if (elements[i].type === 0) {
          this.sk.text(`L: ${ this.l[elIndex].toFixed(2) }`, pos.x, pos.y, 40);
        } else {
          this.sk.text(`R: ${ this.r[elIndex].toFixed(2) }\n A: ${ this.a[elIndex].toFixed(2) }`, pos.x, pos.y, 40);
        }
      }
      this.sk.applyMatrix(...this.negativeRotateMatrix.toArray());
      this.sk.applyMatrix(...flipMatrix.toArray());
    }
  }

  renderProfileNumbers() {
    if (this.import === null) {
      return;
    }
    if (this.showNumbering) {
      let flipMatrix = Matrix.from(1, 0, 0, -1, 0, 0);
      this.sk.textSize(12);
      this.sk.fill(255);
      this.sk.strokeWeight(1 / this.currentZoom.value);
      this.sk.applyMatrix(...flipMatrix.toArray());
      this.sk.applyMatrix(...this.rotateMatrix.toArray());
      let numberOfElements = this.import.elements.length;
      let rightPart = numberOfElements - this.firstElementIndex - 1;
      let elements = this.import.elements;
      for (let i = 0; i < elements.length; i += 2) {
        // let elIndex = i <= rightPart ? i + this.firstElementIndex : numberOfElements - i - 1;
        let elIndex = i < this.firstElementIndex ? numberOfElements - i - 1 : i - this.firstElementIndex;
        // first point
        let pos = flipMatrix.applyToPoint(elements[elIndex].p0.x, elements[elIndex].p0.y);
        pos = this.negativeRotateMatrix.applyToPoint(pos.x, pos.y);
        this.sk.ellipse(pos.x, pos.y, 5);
        // this.sk.text(`${ i <= rightPart ? elIndex + 1: elIndex + 2 }`, pos.x - 20, pos.y);
        this.sk.text(`${ i < this.firstElementIndex ? i + 2: i + 1 }`, pos.x - 20, pos.y);

        //second point
        pos = flipMatrix.applyToPoint(elements[elIndex].p1.x, elements[elIndex].p1.y);
        pos = this.negativeRotateMatrix.applyToPoint(pos.x, pos.y);
        this.sk.ellipse(pos.x, pos.y, 5);
        // this.sk.text(`${ i <= rightPart ? elIndex + 2: elIndex + 1 }`, pos.x - 20, pos.y);
        this.sk.text(`${ i < this.firstElementIndex ? i + 1: i + 2 }`, pos.x - 20, pos.y);
      }
      this.sk.applyMatrix(...this.negativeRotateMatrix.toArray());
      this.sk.applyMatrix(...flipMatrix.toArray());
    }
  }

  renderProfile() {
    if(!!this.import) { // if import not null

      if (this.transformMatrix) {
        this.sk.applyMatrix(...this.transformMatrix.toArray());
      }
      if (this.rotateMatrix) {
        this.sk.applyMatrix(...this.rotateMatrix.toArray());
      }
      
      let selected;
      if (this.selectedElement.index === -1) {
        selected = -1;
      } else if (this.selectedElement.index >= this.firstElementIndex) {
        selected = this.selectedElement.index - this.firstElementIndex;
      } else {
        selected = (this.import.elements.length - 1) - this.selectedElement.index;
      }
      // draw profile and applying transformation matrices
      for(let i = 0; i < this.import.elements.length; i++) {

        if (this.hoveredElement === i || selected === i) { // selected element with bigger weight
          this.sk.strokeWeight(3);
        } else {
          this.sk.strokeWeight(1);
        }

        if(this.import.elements[i].type === 0) {  // draw line
          this.sk.line(
            this.import.elements[i].p0.x,
            this.import.elements[i].p0.y,
            this.import.elements[i].p1.x,
            this.import.elements[i].p1.y
          );
        } else {  // draw arc
          this.sk.noFill();
          this.sk.arc(
            this.import.elements[i].c.x,
            this.import.elements[i].c.y,
            this.import.elements[i].d,
            this.import.elements[i].d,
            this.import.elements[i].from,
            this.import.elements[i].to
          );
        }
        this.sk.strokeWeight(1);
      }
    }
  }

  renderDrawingCollisionMap() {
    if (!!this.drawingCollisionMap) {
      for (let contour of this.drawingCollisionMap) {
        this.sk.beginShape();
        for (let point of contour) {
          this.sk.vertex(point[0], point[1]);
        }
        this.sk.endShape(this.sk.CLOSE);
      }
    }
  }

  renderCollisionMap() {
    if (!!this.collisionMap) {
      for (let contour of this.collisionMap) {
        if (contour[0].length === 2) {
          this.sk.beginShape();
          for (let point of contour) {
            this.sk.vertex(point[0], point[1]);
          }
          this.sk.endShape(this.sk.CLOSE);
        } else {
          for (let quad of contour) {
            this.sk.beginShape();
            for (let point of quad) {
              this.sk.vertex(point[0], point[1]);
            }
            this.sk.endShape(this.sk.CLOSE);
          }
        }
      }
    }
  }

  makeProfileTransformMatrices(axisX, axisY, axisAngle) {
    this.transformMatrix = Matrix.from(1, 0, 0, 1, axisX, axisY);
    this.rotateMatrix = new Matrix().rotateDeg(axisAngle);
    this.negativeRotateMatrix = new Matrix().rotateDeg(-axisAngle);
  }

  mouseMovedHandler() {
    if (this.isPanning && !!this.panStart) {
      let curPos = { x:this.sk.mouseX, y:this.sk.mouseY };
      let deltaX = curPos.x - this.panStart.x;
      let deltaY = curPos.y - this.panStart.y;
      this.tmpPanX = -Math.floor(deltaX);
      this.tmpPanY = Math.floor(deltaY);
    }


    // calc cursor position and check intersection with profile
    this.checkCursorIntersection();
  }
  
  mousePressedHandler() {
    console.log('mouse press handler');
    if (this.isPanning) {
      this.panStart = { x:this.sk.mouseX, y:this.sk.mouseY };
    }
    if (this.isDrawing) {
      this.drawElement();
    }
    this.selectElement();
  }

  mouseReleasedHandler() {
    console.log('mouse released handler');
    if (!!this.panStart) {
      this.panX += this.tmpPanX;
      this.panY += this.tmpPanY;
      this.panStart = null;
      this.tmpPanX = 0;
      this.tmpPanY = 0;
    }
  }

  checkCursorIntersection() {
    let cursorX = this.sk.mouseX;
    let cursorY = this.sk.mouseY;
    let draftCenterX = this.sk.width / 2 + this.panX + this.tmpPanX;
    let draftCenterY = this.sk.height / 2 - this.panY - this.tmpPanY;
    let newCenter, newCursor;

    let scaleMatrix = new Matrix().scaleU(this.currentZoom.value);

    newCenter = Matrix.from(1, 0, 0, -1, 0, 0).applyToPoint(draftCenterX, draftCenterY);
    newCursor = Matrix.from(1, 0, 0, -1, 0, 0).applyToPoint(cursorX, cursorY);

    if (this.transformMatrix) {
      newCenter = this.transformMatrix.clone().applyToPoint(newCenter.x, newCenter.y);
    }
    // newCursor = scaleMatrix.applyToPoint(newCursor.x, newCursor.y);


    if (this.negativeRotateMatrix) {
      newCenter = this.negativeRotateMatrix.clone().applyToPoint(newCenter.x, newCenter.y);
      newCursor = this.negativeRotateMatrix.clone().applyToPoint(newCursor.x, newCursor.y);
    }

    cursorX = newCursor.x - newCenter.x; 
    cursorY = -(newCenter.y - newCursor.y);

    if (!!this.collisionMap) {
      this.hoveredElement = this.collisionDetector.checkCollisions({ x: cursorX, y: cursorY }, this.collisionMap);
    }
    if (!!this.drawingCollisionMap) {
      this.drawingAxisCenterHovered = this.collisionDetector.checkCollisions({ x: cursorX, y: cursorY }, this.drawingCollisionMap);
    }
  }

  drawElement() {
    let invertMatrix = this.draftTranformMatrix.clone()
      .translate(this.panX + this.tmpPanX, this.panY + this.tmpPanY)
      .scaleU(this.currentZoom.value).inverse();
    let { x, y } = invertMatrix.applyToPoint(this.sk.mouseX, this.sk.mouseY);
    let point = this.sk.createVector(x, y);
    // if line not started
    if (this.tmpEl === null) {
      this.tmpEl = { type: 0, p0: point };
    } else {
      this.tmpEl.p1 = point;
      this.drawing.push(Object.assign({}, this.tmpEl));
      this.tmpEl = { type: 0, p0: point };
    }
  }

  selectElement() {
    if (!!this.collisionMap && this.firstElementIndex !== -1) {
      if (this.hoveredElement === -1) {
        this.selectedElement.index = -1;
        return;
      }
      let numberOfElements = this.collisionMap.length;
      let rightPartLength = numberOfElements - (this.firstElementIndex + 1);
      if (this.hoveredElement <= rightPartLength) {
        this.selectedElement.index = this.firstElementIndex + this.hoveredElement;
      } else {
        this.selectedElement.index = numberOfElements - 1 - this.hoveredElement;
      }
    }

    if (!!this.drawingCollisionMap) {
      if (this.drawingAxisCenterHovered === -1) {
        this.drawingAxisCenterSelected.index = -1;
      } else {
        this.drawingAxisCenterSelected.index = (this.drawingAxisCenterHovered + 2) * 0.5;
      }
    }
  }
  // point at the ends of drawing elements
  calcDrawingPoints() {
    if (this.drawing.length === 0) {
      return;
    }

    for (let i = 0; i < this.drawing.length; i++) {
      let curEl = this.drawing[i];
      if (curEl.type === 0) {
        let p0v = this.sk.createVector(curEl.p0.x, curEl.p0.y);
        let p1v = this.sk.createVector(curEl.p1.x, curEl.p1.y);
        let p2 = p5.Vector.sub(p0v, p1v);
        let p3 = p5.Vector.fromAngle(this.sk.radians(p2.heading()), p5.Vector.dist(p0v, p1v) / 2);
        let center = p5.Vector.add(p1v, p3);

        if ('reversed' in this.drawing) {
          this.drawingDots.push({ x:p1v.x, y:p1v.y });
          this.drawingDots.push({ x:center.x, y:center.y });
          this.drawingDots.push({ x:p0v.x, y:p0v.y });
        } else {
          this.drawingDots.push({ x:p0v.x, y:p0v.y });
          this.drawingDots.push({ x:center.x, y:center.y });
          this.drawingDots.push({ x:p1v.x, y:p1v.y });
        }

      } else {
        let cv = this.sk.createVector(curEl.c.x, curEl.c.y);
        let from = curEl.from < 0 ? 360 + curEl.from : curEl.from;
        let to = curEl.to < 0 ? 360 + curEl.to : curEl.to;
        if (to < from) {
          to += 360;
        }
        let angle = (to - from) / 2;
        let radial = p5.Vector.fromAngle(this.sk.radians(from + angle), curEl.d / 2);
        let point = p5.Vector.add(cv, radial);
        this.drawingDots.push({ x: point.x, y:point.y });
      }
    }
  }

  calcDrawingAxisPos() {
    let ax, ay, aa;
    let elIndex = Math.min(Math.floor(this.drawingAxisCenterSelected.index - 1), this.drawing.length - 1);
    let element = this.drawing[elIndex];
    if (element.type === 0) {
      let p0v = this.sk.createVector(element.p0.x, element.p0.y);
      let p1v = this.sk.createVector(element.p1.x, element.p1.y);
      let p2 = p5.Vector.sub(p1v, p0v);
      if (this.drawingAxisCenterSelected.index === elIndex + 1) {
        ax = element.p0.x;
        ay = element.p0.y;
        aa = p2.heading();
      } else {
        let offset = this.drawingAxisCenterSelected.index - 1 - elIndex;
        let len = p5.Vector.dist(p0v, p1v);
        let p3 = p5.Vector.fromAngle(this.sk.radians(p2.heading()), len * offset);
        let axis = p5.Vector.add(p0v, p3);
        ax = axis.x;
        ay = axis.y;
        aa = p2.heading();
      }

    } else {
      let radial, axis, angle;
      let cv = this.sk.createVector(element.c.x, element.c.y);
      let from = element.from < 0 ? 360 + element.from : element.from;
      let to = element.to < 0 ? 360 + element.to : element.to;
      if (to < from) {
        to += 360;
      }
      if (this.drawingAxisCenterSelected.index === elIndex + 1) {
        radial = p5.Vector.fromAngle(this.sk.radians(from), element.d / 2);
      } else {
        let offset = this.drawingAxisCenterSelected.index - 1 - elIndex;
        angle = (to - from) * offset;
        radial = p5.Vector.fromAngle(this.sk.radians(from + angle), element.d / 2);
      }

      let prevLine = this.drawing[elIndex - 1];
      let nextLine = this.drawing[elIndex + 1];
      let p01 = this.sk.createVector(prevLine.p0.x, prevLine.p0.y);
      let p11 = this.sk.createVector(prevLine.p1.x, prevLine.p1.y);
      let p02 = this.sk.createVector(nextLine.p0.x, nextLine.p0.y);
      let p12 = this.sk.createVector(nextLine.p1.x, nextLine.p1.y);
      let prevLineV = p5.Vector.sub(p11, p01).normalize();
      let nextLineV = p5.Vector.sub(p12, p02).normalize();
      let cross = p5.Vector.cross(prevLineV, nextLineV);
      axis = p5.Vector.add(cv, radial);
      ax = axis.x;
      ay = axis.y;
      aa = cross.z < 0 ? this.sk.degrees(radial.heading()) - 90 : this.sk.degrees(radial.heading()) + 90;
    }
    return { ax, ay, aa };
  }

  keyPressedHandler() {
    console.log('key pressed');
    if (this.isDrawing) {
      if (this.sk.keyCode === this.sk.ENTER) {
        this.setRoundings();
        // reverse array if start.x > end.x
        if (this.drawing[0].p0.x > this.drawing[this.drawing.length - 1].p1.x) {
          this.drawing.reversed = true;
        }
        this.calcDrawingPoints();
        this.drawingCollisionMap = this.collisionDetector.buildDrawingCollisionMap(this.drawingDots);
        console.log(this.drawingCollisionMap);
        this.isDrawing = false;
        this.tmpEl = null;
      }
    }
  }
  // position for information about profile parts
  calcInfoPositions() {
    this.sizesPos = [];
    let numberOfElements = this.import.elements.length;
    let rightPart = numberOfElements - this.firstElementIndex - 1;
    let elements = this.import.elements;
    for (let i = 0; i < numberOfElements; i++) {
      if (elements[i].type === 0) {
        let normalAngle;
        let p0v = this.sk.createVector(elements[i].p0.x, elements[i].p0.y);
        let p1v = this.sk.createVector(elements[i].p1.x, elements[i].p1.y);
        let p2 = p5.Vector.sub(p1v, p0v);
        let p3 = p5.Vector.fromAngle(this.sk.radians(p2.heading()), p5.Vector.dist(p0v, p1v) / 2);
        let center = p5.Vector.add(p0v, p3);
        if (i <= rightPart) {
          normalAngle = -90;
        } else {
          normalAngle = 90;
        }
        let normal = p5.Vector.fromAngle(this.sk.radians(p2.heading() + normalAngle), 40);
        let result = p5.Vector.add(center, normal); 
        this.sizesPos.push({ x: result.x, y: result.y });
      } else {
        let center = this.sk.createVector(elements[i].c.x, elements[i].c.y);
        let angle = Math.abs(elements[i].from - elements[i].to) / 2;
        console.log('angle', angle);
        let radial = p5.Vector.fromAngle(this.sk.radians(elements[i].from + angle), elements[i].d * 0.75);
        let result = p5.Vector.add(center, radial);
        this.sizesPos.push({ x:result.x, y:result.y });
      }
    }
  }
}