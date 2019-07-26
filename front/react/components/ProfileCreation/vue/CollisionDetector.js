import p5 from 'p5';

export default class CollisionDetector {
  constructor() {
    this.sk = null;
  }

  buildCollisionMap(elements) {
    let collisionMap = [];
    let offset = 10; // offset from original profile line

    // return if empty elements array passed
    if (!elements) {
      return collisionMap;
    }

    for (let element of elements) {
      if (element.type == 0) { // if element is line
        let { p0, p1 } = this.findParallelLine(element, offset, 1);
        let { p0: p3, p1: p2 } = this.findParallelLine(element, offset, -1);
        collisionMap.push([ [p0.x, p0.y], [p1.x, p1.y], [p2.x, p2.y], [p3.x, p3.y] ]);
      } else { // if element is arc
        let arcPoly = [];
        let outerLine = []; // point with bigger radius
        let innerLine = []; // point with smaller radius
        let arcCenter = this.sk.createVector(element.c.x, element.c.y);
        let arcAngle = Math.abs(element.to - element.from);
        let stepsNumber = Math.floor(Math.max(3, arcAngle / 15)); // point every 15 deg but min 3 point
        let angleStep = arcAngle / stepsNumber;
        for (let i = 0; i <= stepsNumber; i++) {
          let smallRadialVector = p5.Vector.fromAngle(
            this.sk.radians(element.from + angleStep * i), 
            element.d / 2 - offset
          );
          let bigRadialVector = p5.Vector.fromAngle(
            this.sk.radians(element.from + angleStep * i), 
            element.d / 2 + offset
          );
          let innerPoint = p5.Vector.add(arcCenter, smallRadialVector);
          let outerPoint = p5.Vector.add(arcCenter, bigRadialVector);
          innerLine.push([ innerPoint.x, innerPoint.y ]);
          outerLine.push([ outerPoint.x, outerPoint.y ]);
          if (innerLine.length === 2) {
            arcPoly.push(innerLine.concat(outerLine.slice().reverse()).slice());
            innerLine.shift();
            outerLine.shift();
          }
        }
        collisionMap.push(arcPoly.slice());
      }
    }
    console.log(collisionMap);
    return collisionMap;
  }

  buildDrawingCollisionMap(elements) {
    let collisionMap = [];
    let offset = 10;

    // return if empty elements array passed
    if (!elements) {
      return collisionMap;
    }

    for (let element of elements) {
      let p1, p2, p3, p4;
      let el = [];
      p1 = [element.x - offset, element.y + offset];
      p2 = [element.x + offset, element.y + offset];
      p3 = [element.x + offset, element.y - offset];
      p4 = [element.x - offset, element.y - offset];
      el.push(p1, p2, p3, p4);
      collisionMap.push(el);
    }
    return collisionMap;
  }

  findParallelLine(line, offset, direction) {
    let v0 = this.sk.createVector(line.p0.x, line.p0.y);
    let v1 = this.sk.createVector(line.p1.x, line.p1.y);
    let parallel = p5.Vector.sub(v1, v0);
    let normal = p5.Vector.fromAngle(this.sk.radians(parallel.heading()) + direction * this.sk.HALF_PI, offset);
    return {
      p0: p5.Vector.sub(v0, normal),
      p1: p5.Vector.sub(v1, normal)
    };
  }

  checkCollisions(point, collisionMap) {
    for (let i = 0; i < collisionMap.length; i++) {
      if (collisionMap[i][0].length === 2) {
        if (this.isPointInPolygon(point, collisionMap[i])) {
          return i;
        }
      } else {
        for (let quad of collisionMap[i]) {
          if (this.isPointInPolygon(point, quad)) {
            return i;
          }
        }
      }
    }
    return -1;
  }

  isPointInPolygon(point, polygon) {
    let { x: pointX, y: pointY } = point;
    
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        let xi = polygon[i][0], yi = polygon[i][1];
        let xj = polygon[j][0], yj = polygon[j][1];
        
        let intersect = ((yi > pointY) != (yj > pointY))
            && (pointX < (xj - xi) * (pointY - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
  }
}