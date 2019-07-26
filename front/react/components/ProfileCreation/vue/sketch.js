export const sketch = (draft, collisionDetector, canvasElement) => {
  return (sk) => {
    sk.setup = () => {
      let canvas = sk.createCanvas(canvasElement.clientWidth, canvasElement.clientHeight);
      canvas.parent("canvas-wrapper");

      // mouse and keyboard handlers
      canvas.mousePressed(() => draft.mousePressedHandler());
      canvas.mouseMoved(() => draft.mouseMovedHandler());
      canvas.mouseReleased(() => draft.mouseReleasedHandler());
      sk.keyPressed = draft.keyPressedHandler.bind(draft);

      sk.frameRate(30);
      sk.background(1);
      sk.fill(255);
      sk.textSize(16);
      draft.sk = sk;
      collisionDetector.sk = sk;
      draft.draftTranformMatrix.translate(sk.width/2, sk.height/2).flipY();
    };
  
    sk.draw = () => {
      sk.background(1);
      sk.angleMode(sk.DEGREES);
      
      sk.applyMatrix(...draft.draftTranformMatrix.toArray());
      sk.translate(draft.panX, draft.panY);
      sk.translate(draft.tmpPanX, draft.tmpPanY);
      sk.scale(draft.currentZoom.value);

      sk.stroke(0, 255, 0); // green line Y
      sk.line(0, 0, 0, 40 / draft.currentZoom.value);
      sk.stroke(255, 0, 0); // red line X
      sk.line(0, 0, 40 / draft.currentZoom.value, 0);

      sk.stroke(255);
      draft.render();
      sk.stroke(0, 255, 0); // green line Y
      sk.line(0, 0, 0, 40 / draft.currentZoom.value);
      sk.stroke(255, 0, 0); // red line X
      sk.line(0, 0, 40 / draft.currentZoom.value, 0);
    };
  
    sk.windowResized = () => {
      sk.resizeCanvas(sk.windowWidth, sk.windowHeight);
    };
  }
}