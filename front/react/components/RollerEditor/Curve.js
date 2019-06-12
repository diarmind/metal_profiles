const SharedFormats = {
    VECTOR: 'vector',
    LINE: 'line',
    ARC: 'arc',
    CURVE: 'curve',
    ANGLE: 'angle',
    BIAS: 3,
    InteriorEquid: 'Interior',
    ExternalEquid: 'Externl',
};

class VectorShared {
	constructor({x,y,z}) {
		this.x = x;
		this.y = y;
		this.z = z;
	}
}

class LineShared {
	constructor({x1,y1,z1,x2,y2,z2, equidLine, equidType}){//, InteriorEquid, ExternalEquid}) {
		this.x1 = x1;
		this.x2 = x2;
		this.y1 = y1;
		this.y2 = y2;
		this.z1 = z1;
		this.z2 = z2;
		this.type = SharedFormats.LINE;
		this.equidLine = equidLine;
		this.shear = 0;
		this.line = drawLine([
				{x: this.x1, y: this.y1, z: this.z1},
				{x: this.x2, y: this.y2, z: this.z2}
			]
		);
		this.color = 0x000000;
		this.line.material = new THREE.LineBasicMaterial({color:this.color, linewidth: 1})
		this.useInRoll = true;
		this.id = uuidv4();
			if (this.equidLine) {
			domEvents.addEventListener(this.line, 'mouseover', event => {
				this.line.material = new THREE.LineBasicMaterial({color:0x008800});
			});
			domEvents.addEventListener(this.line, 'mouseout', event => {
					this.line.material = new THREE.LineBasicMaterial({color: this.color});
			});
			this.equidType = equidType;
			domEvents.addEventListener(this.line, 'click', event => {
				if(isEditing && event.origDomEvent.shiftKey) {
					if (typeof rolls[selectedId].objs[this.id] == "undefined") {
						for (let id in rolls) {
							if (rolls[id].objs[this.id] != "undefined") {
								rolls[id].removeObj(this);
							}
						}
						rolls[selectedId].addObj(this);
					} else {
						rolls[selectedId].removeObj(this);
						this.setColor(defaultColor);
					}
				}
			});
		}
	}

	length() {
		let d_x = this.x1 - this.x2;
		let d_y = this.y1 - this.y2;
		let d_z = this.z1 - this.z2;
		return Math.sqrt(d_x * d_x + d_y * d_y + d_z * d_z);
	}

	getVector(direction) {
		if (direction === 1) {
			return new VectorPEP(this.x1 - this.x2, this.y1 - this.y2, this.z1 - this.z2);
		} else {
			return new VectorPEP(this.x2 - this.x1, this.y2 - this.y1, this.z2 - this.z1);
		}
	}

	draw() {}

	getEquid({revert, equidType}) {
		let pEqInternal_1 = getEquidistantPoint(
			{x: this.x1, y: this.y1, z: this.z1},
			{x: this.x2, y: this.y2, z: this.z2},
			globalBias, revert ? true : false
		);
		let pEqInternal_2 = getEquidistantPoint(
			{x: this.x2, y: this.y2, z: this.z2},
			{x: this.x1, y: this.y1, z: this.z1},
			globalBias, revert ? false : true
		);
		let l = new LineShared({
			x1: pEqInternal_1.x,
			y1: pEqInternal_1.y,
			z1: pEqInternal_1.z,
			x2: pEqInternal_2.x,
			y2: pEqInternal_2.y,
			z2: pEqInternal_2.z,
			equidLine : true,
			equidType : equidType,
		});
		return l;
	}

	addListener() {
		domEvents.addEventListener(this.line, 'click', event => {
			if (event.origDomEvent.altKey || isEditing) {
				return;
			}
			this.shear = Number(prompt('Если хотите удлинить или укоротить отрезок, введите положительное или отрицательное число соответственно. Для восстановления оставьте "0"', 0));
			domEvents.removeEventListener(this.line, 'click');
			domEvents.removeEventListener(this.line, 'mouseover');
			domEvents.removeEventListener(this.line, 'mouseout');
			scene.remove(this.line);
			this.line = drawLine([{x: this.x2, y: this.y2, z: this.z2}, this.getShearCoords()]);
			this.line.material = new THREE.LineBasicMaterial({color:this.color, linewidth: 1});
			if (this.equidLine) {
				domEvents.addEventListener(this.line, 'click', event => {
					if(!event.origDomEvent.altKey) {
						return;
					}
					let result = confirm(this.useInRoll ? "Не использовать данный сегмент?" : "Использовать данный сегмент?");
					if (result) {
						this.useInRoll = !this.useInRoll;
						if (this.useInRoll) {
							this.line.material = new THREE.LineBasicMaterial({color:this.color});
						} else {
							this.line.material = new THREE.LineBasicMaterial({color:this.color});
						}
					}
				});
			}
			this.addListener();
		});
	}

	getShearCoords() {
		let uniV = getUnitVector({x: this.x1, y: this.y1, z: this.z1}, {x: this.x2, y: this.y2, z: this.z2});
		let shear = SumMatrix(multMatrixNumber(this.shear, [[uniV.x, uniV.y, uniV.z]]), [[this.x1, this.y1, this.z1]]);
		return {x: shear[0][0], y: shear[0][1], z: shear[0][2]};
	}

	setColor(color) {
		this.color = color;
		this.line.material = new THREE.LineBasicMaterial({color:this.color, linewidth: 1});
	}

	getMaxY() {
		return this.y1 > this.y2 ? this.y1 : this.y2;
	}

	getMinY() {
		return this.y1 < this.y2 ? this.y1 : this.y2;
	}
}

class Angle {
	constructor({x1,y1,z1,x2,y2,z2,x3,y3,z3}) {
		this.x1 = x1;
		this.x2 = x2;
		this.x3 = x3;
		this.y1 = y1;
		this.y2 = y2;
		this.y3 = y3;
		this.z1 = z1;
		this.z2 = z2;
		this.z3 = z3;
		this.type = SharedFormats.ANGLE;
		this.color = 0x000000;
		this.line = NaN;
		this.id = uuidv4();
	}

	draw() {
		scene.remove(this.line);
		this.line = drawLine(
			[
				{x: this.x1, y: this.y1, z: this.z1},
				{x: this.x2, y: this.y2, z: this.z2},
				{x: this.x3, y: this.y3, z: this.z3}
			]
		);
		this.line.material = new THREE.LineBasicMaterial({color:this.color, linewidth: 1});
		return this.line;
	}

	setColor(color) {
		this.color = color;
		this.line.material = new THREE.LineBasicMaterial({color:this.color, linewidth: 1});
	}

	getMaxY() {
		if (this.y1 > this.y2 && this.y1 > this.y3) {
			return this.y3;
		}
		if (this.y2 > this.y3) {
			return this.y2;
		}
		return this.y3;
	}

	getMinY() {
		if (this.y1 < this.y2 && this.y1 < this.y3) {
			return this.y3;
		}
		if (this.y2 < this.y3) {
			return this.y2;
		}
		return this.y3;
	}
}

class ArcShared {
	constructor({x,y,z,R,fi_start, fi_end, points = [], equidArc}) {
		this.x = x;
		this.y = y;
		this.z = z;
		this.R = R;
		this.fi_start = fi_start;
		this.fi_end = fi_end;
		this.points = points;
		this.type = SharedFormats.ARC;
		this.equidArc = equidArc;
		this.useInRoll = true;
		this.color = 0x000000;
		this.id = uuidv4();
		let curve_points = this.getPoints();
		this.line = drawLine(curve_points.map(function (p) {
			return {x: p.x, y: p.y, z: p.z};
		}));
		this.line.material = new THREE.LineBasicMaterial({color:this.color, linewidth: 1});
	}

	pushPoint(point) {
		this.points.push(point);
	}

	getPoints() {
		let ellipse = new THREE.EllipseCurve(
			this.x, this.y,
			this.R, this.R,
			this.fi_start, this.fi_end
		);
		let curve_points = ellipse.getPoints(70);
		curve_points.forEach((cp) => {
			cp.z = this.z;
		});
		return curve_points;
	}

	draw() {
		scene.remove(this.line);
		let curve_points = this.getPoints();
		this.line = drawLine(curve_points.map(function (p) {
			return {x: p.x, y: p.y, z: p.z};
		}));
		this.line.material = new THREE.LineBasicMaterial({color:this.color, linewidth: 1});
		return this.line;
	}

	setColor(color) {
		this.color = color;
		this.line.material = new THREE.LineBasicMaterial({color:this.color, linewidth: 1});
	}

	getMaxY() {
		let points = this.getPoints();
		let maxY = points.reduce(function(mY, current) {
			return mY > current.y ? mY : current.y;
		}, -Infinity);	
		return maxY;
	}

	getMinY() {
		let points = this.getPoints();
		let minY = points.reduce(function(mY, current) {
			return mY < current.y ? mY : current.y;
		}, Infinity);
		return minY;
	}
}

class CurveShared {
	constructor(objs) {
		this.objs = objs.map(function (element, index) {
			return {id: this.index, obj: element};
		});
	}
	push(element) {
		this.objs.push({id: this.objs.length, obj: element});
	}
	unshift(element) {
		this.objs.unshift({id: this.objs.length, obj: element});
	}

	draw() {
		this.objs.forEach(function(element, index) {
			element.obj.draw();
		});
	}

	remove() {
		this.objs = objs.map(function (element, index) {
			element.remove();
		});
	}
}

class EquidArc {
	constructor({Arc, Angle, inUse, equidType}) {
		this.arc = Arc;
		this.angle = Angle;
		this.inUse = inUse;
		this.useInRoll = true;
		this.id = uuidv4();
		this.equidType = equidType;
	}

	draw() {
		let line;
		if (this.inUse == SharedFormats.ARC) {
			line = this.arc.draw();
			domEvents.addEventListener(line, 'mouseover', event => {
				line.material = new THREE.LineBasicMaterial({color:0x008800});
			});
			domEvents.addEventListener(line, 'mouseout', event => {
				line.material = new THREE.LineBasicMaterial({color:this.arc.color, linewidth: 1});
			});
			domEvents.addEventListener(this.arc.line, 'click', event => {
				if (isEditing) {
					if (event.origDomEvent.shiftKey) {
						if(isEditing && event.origDomEvent.shiftKey) {
							if (typeof rolls[selectedId].objs[this.id] == "undefined") {
								for (let id in rolls) {
									if (rolls[id].objs[this.id] != "undefined") {
										rolls[id].removeObj(this);
									}
								}
								rolls[selectedId].addObj(this);
							} else {
								rolls[selectedId].removeObj(this);
								this.setColor(defaultColor);
							}
						}
					}
				} else {
					if (typeof this.angle.type == "undefined") {
						return;
					}
					this.inUse = SharedFormats.ANGLE;
					domEvents.removeEventListener(line, 'click');
					domEvents.removeEventListener(line, 'mouseover');
					domEvents.removeEventListener(line, 'mouseout');
					scene.remove(line);
					this.draw();
				}
			}, true);
		} else if (this.inUse == SharedFormats.ANGLE) {
			line = this.angle.draw();
			domEvents.addEventListener(line, 'mouseover', event => {
				line.material = new THREE.LineBasicMaterial({color:0x008800});
			});
			domEvents.addEventListener(line, 'mouseout', event => {
				line.material = new THREE.LineBasicMaterial({color:this.angle.color, linewidth: 1});
			});
			domEvents.addEventListener(line, 'click', event => {
				if (isEditing) {
					if (event.origDomEvent.shiftKey) {
						if (typeof rolls[selectedId].objs[this.id] == "undefined") {
							for (let id in rolls) {
								if (rolls[id].objs[this.id] != "undefined") {
									rolls[id].removeObj(this);
								}
							}
							rolls[selectedId].addObj(this);
						} else {
							rolls[selectedId].removeObj(this);
							this.setColor(defaultColor);
						}
					}
				} else {
					if (typeof this.arc.type == "undefined") {
						return;
					}
					this.inUse = SharedFormats.ARC;
					domEvents.removeEventListener(line, 'click');
					domEvents.removeEventListener(line, 'mouseover');
					domEvents.removeEventListener(line, 'mouseout');
					scene.remove(line);
					this.draw();
				}
			}, true);
		}
		return line;
	}

	setColor(color) {
		if (typeof this.arc.type != "undefined") {
			this.arc.color = color;
			if (this.inUse == SharedFormats.ARC) {
				this.arc.line.material = new THREE.LineBasicMaterial({color:color, linewidth: 1});
			}
		}
		if (typeof this.angle.type != "undefined") {
			this.angle.color = color;
			if (this.inUse == SharedFormats.ANGLE) {
				this.angle.line.material = new THREE.LineBasicMaterial({color:color, linewidth: 1});
			}
		}
	}

	getMaxY() {
		if (this.inUse == SharedFormats.ARC) {
			return this.arc.getMaxY();
		} else {
			return this.angle.getMaxY();
		}
	}

	getMinY() {
		if (this.inUse == SharedFormats.ARC) {
			return this.arc.getMinY();
		} else {
			return this.angle.getMinY();
		}
	}
}

class Roll {
	constructor({color, id}) {
		this.color = color;
		this.id = id;
		this.objs = {};
		this.side = undefined;
		this.axis = undefined;
		this.leftSide = undefined;
		this.rigthSide = undefined;
	}

	addObj(obj) {
		if (typeof this.side == "undefined" || Object.keys(this.objs).length == 0) {
			this.side = obj.equidType;
		}
		if (this.side != obj.equidType) {
			alert("Данная прямая не может быть частью выбранного валка!");
			return;
		}
		this.objs[obj.id] = obj;
		obj.setColor(selectedColor);
	}

	removeObj(obj) {
		obj.setColor(defaultColor);
		delete this.objs[obj.id];
		if (Object.keys(this.objs).length == 0) {
			this.side = undefined;
		}
		// scene.remove(this.axis.line);
		// this.axis = undefined;
	}

	setColor(color) {
		this.color = color;
		for (let id in this.objs) {
			this.objs[id].setColor(color);
		}
	}

	getAxis() {
		if (typeof this.axis != "undefined") {		//очистка старого, если уже сохраняли
			scene.remove(this.axis.line);
			this.axis = undefined;
		}
		if (typeof this.rigthSide != "undefined") {
			scene.remove(this.rigthSide.line);
			this.rigthSide = undefined;
		}
		if (typeof this.leftSide != "undefined") {
			scene.remove(this.leftSide.line);
			this.leftSide = undefined;
		}

		if (this.side == SharedFormats.InteriorEquid) {
			let usingCurve = InteriorEquidCurve;
			let lines = [];
			let maxY = undefined;
			for (let el of usingCurve.objs) {
				if (typeof this.objs[el.obj.id] != "undefined") {
					lines.push(el);
					let elMaxY = el.obj.getMaxY()
					if (typeof maxY == "undefined" || elMaxY > maxY) {
						maxY = elMaxY;
					}
				}
			}
			let newY = maxY + 3 * globalBias; 
			
			let newXLeft, newXRigth, newYLeft, newYRigth;

			if (lines[0].obj.type == SharedFormats.LINE) {
				if (lines[0].obj.shear != 0) {
					let shearCoord = lines[0].obj.getShearCoords();
					newXLeft = shearCoord.x;
					newYLeft = shearCoord.y;
				} else {
					newXLeft = Math.min.apply(null, [lines[0].obj.x2, lines[0].obj.x1]);
					newYLeft = lines[0].obj.x1 < lines[0].obj.x2 ? lines[0].obj.y1 : lines[0].obj.y2;
				}
			} else {
				if (lines[0].obj.inUse == SharedFormats.ARC) {
					let points = lines[0].obj.arc.getPoints();
					newXLeft = Math.min.apply(null, points.map(function(el) {return el.x}));
					newYLeft = points.reduce(function(el, current) {if (current.x === newXLeft) { return current.y } else return el }, 0);
				} else {
					newXLeft = Math.min.apply(null, [lines[0].obj.angle.x1, lines[0].obj.angle.x2, lines[0].obj.angle.x3]);
					newYLeft = Math.min.apply(null, [lines[0].obj.angle.y1, lines[0].obj.angle.y2, lines[0].obj.angle.y3]);		
				}
			}

			if (lines[lines.length - 1].obj.type == SharedFormats.LINE) {
				if (lines[lines.length - 1].obj.shear != 0) {
					let shearCoord = lines[lines.length - 1].obj.getShearCoords();
					newXRigth = shearCoord.x;
					newYRigth = shearCoord.y;
				} else {
					newXRigth = Math.max.apply(null, [lines[lines.length - 1].obj.x2, lines[lines.length - 1].obj.x1]);
					newYRigth = lines[lines.length - 1].obj.x2 > lines[lines.length - 1].obj.y1 ? lines[lines.length - 1].obj.y2 : lines[lines.length - 1].obj.y1;
				}
			} else {
				if (lines[lines.length - 1].obj.inUse == SharedFormats.ARC) {
					let points = lines[lines.length - 1].obj.arc.getPoints();
					newXRigth = Math.max.apply(null, points.map(function(el) {return el.x}));
					newYRigth = points.reduce(function(el, current) {if (current.x === newXRigth) { return current.y } else return el }, 0);
				} else {
					newXRigth = Math.max.apply(null, [lines[lines.length - 1].obj.angle.x1, lines[lines.length - 1].obj.angle.x2, lines[lines.length - 1].obj.angle.x3]);
					newYRigth = Math.max.apply(null, [lines[lines.length - 1].obj.angle.y1, lines[lines.length - 1].obj.angle.y2, lines[lines.length - 1].obj.angle.y3]);
				}
			}

			this.axis = new LineShared(
				{
					x1: newXLeft,
					y1: newY,
					z1: lines[0].obj.z2,
					x2: newXRigth,
					y2: newY,
					z2: lines[lines.length - 1].obj.z2,
				}
			);

			this.leftSide = new LineShared(
				{
					x1: newXLeft,
					y1: newYLeft,
					z1: lines[0].obj.z2,
					x2: newXLeft,
					y2: newY,
					z2: lines[lines.length - 1].obj.z2,
				}
			);
			this.leftSide.line.material = new THREE.LineBasicMaterial({color:this.color, linewidth: 1});

			this.rigthSide = new LineShared(
				{
					x1: newXRigth,
					y1: newYRigth,
					z1: lines[0].obj.z2,
					x2: newXRigth,
					y2: newY,
					z2: lines[lines.length - 1].obj.z2,
				}
			);
			this.rigthSide.line.material = new THREE.LineBasicMaterial({color:this.color, linewidth: 1});

			this.axis.line.material = new THREE.LineBasicMaterial({color:this.color, linewidth: 1});
			return [{x:newXLeft, y: newY, z:0}, {x:newXRigth, y: newY, z:0}];
		} else {
			let usingCurve = ExternalEquidCurve;
			let lines = [];
			let minY = undefined;
			for (let el of usingCurve.objs) {
				if (typeof this.objs[el.obj.id] != "undefined") {
					lines.push(el);
					let elMinY = el.obj.getMinY();
					if (typeof minY == "undefined" || elMinY < minY) {
						minY = elMinY;
					}
				}
			}
			let newY = minY - 3 * globalBias; 
			
			let newXLeft, newXRigth, newYLeft, newYRigth;

			if (lines[0].obj.type == SharedFormats.LINE) {
				if (lines[0].obj.shear != 0) {
					let shearCoord = lines[0].obj.getShearCoords();
					newXLeft = shearCoord.x;
					newYLeft = shearCoord.y;
				} else {
					newXLeft = Math.min.apply(null, [lines[0].obj.x2, lines[0].obj.x1]);
					newYLeft = lines[0].obj.x1 < lines[0].obj.x2 ? lines[0].obj.y1 : lines[0].obj.y2;
				}
			} else {
				if (lines[0].obj.inUse == SharedFormats.ARC) {
					let points = lines[0].obj.arc.getPoints();
					newXLeft = Math.min.apply(null, points.map(function(el) {return el.x}));
					newYLeft = points.reduce(function(el, current) {if (current.x === newXLeft) { return current.y } else return el }, 0);
				} else {
					newXLeft = Math.min.apply(null, [lines[0].obj.angle.x1, lines[0].obj.angle.x2, lines[0].obj.angle.x3]);
					newYLeft = Math.min.apply(null, [lines[0].obj.angle.y1, lines[0].obj.angle.y2, lines[0].obj.angle.y3]);		
				}
			}

			if (lines[lines.length - 1].obj.type == SharedFormats.LINE) {
				if (lines[lines.length - 1].obj.shear != 0) {
					let shearCoord = lines[lines.length - 1].obj.getShearCoords();
					newXRigth = shearCoord.x;
					newYRigth = shearCoord.y;
				} else {
					newXRigth = Math.max.apply(null, [lines[lines.length - 1].obj.x2, lines[lines.length - 1].obj.x1]);
					newYRigth = lines[lines.length - 1].obj.x2 > lines[lines.length - 1].obj.y1 ? lines[lines.length - 1].obj.y2 : lines[lines.length - 1].obj.y1;
				}
			} else {
				if (lines[lines.length - 1].obj.inUse == SharedFormats.ARC) {
					let points = lines[lines.length - 1].obj.arc.getPoints();
					newXRigth = Math.max.apply(null, points.map(function(el) {return el.x}));
					newYRigth = points.reduce(function(el, current) {if (current.x === newXRigth) { return current.y } else return el }, 0);
				} else {
					newXRigth = Math.max.apply(null, [lines[lines.length - 1].obj.angle.x1, lines[lines.length - 1].obj.angle.x2, lines[lines.length - 1].obj.angle.x3]);
					newYRigth = Math.max.apply(null, [lines[lines.length - 1].obj.angle.y1, lines[lines.length - 1].obj.angle.y2, lines[lines.length - 1].obj.angle.y3]);
				}
			}

			this.leftSide = new LineShared(
				{
					x1: newXLeft,
					y1: newYLeft,
					z1: lines[0].obj.z2,
					x2: newXLeft,
					y2: newY,
					z2: lines[lines.length - 1].obj.z2,
				}
			);
			this.leftSide.line.material = new THREE.LineBasicMaterial({color:this.color, linewidth: 1});

			this.rigthSide = new LineShared(
				{
					x1: newXRigth,
					y1: newYRigth,
					z1: lines[0].obj.z2,
					x2: newXRigth,
					y2: newY,
					z2: lines[lines.length - 1].obj.z2,
				}
			);
			this.rigthSide.line.material = new THREE.LineBasicMaterial({color:this.color, linewidth: 1});

			this.axis = new LineShared(
				{
					x1: newXLeft,
					y1: newY,
					z1: lines[0].obj.z2,
					x2: newXRigth,
					y2: newY,
					z2: lines[lines.length - 1].obj.z2,
				}
			);
			this.axis.line.material = new THREE.LineBasicMaterial({color:this.color, linewidth: 1});
			return [{x:newXLeft, y: newY, z:0}, {x:newXRigth, y: newY, z:0}];
		}
	}

	dropRoll() {
		if (typeof this.axis != "undefined") {		//очистка старого, если уже сохраняли
			scene.remove(this.axis.line);
			this.axis = undefined;
		}
		if (typeof this.rigthSide != "undefined") {
			scene.remove(this.rigthSide.line);
			this.rigthSide = undefined;
		}
		if (typeof this.leftSide != "undefined") {
			scene.remove(this.leftSide.line);
			this.leftSide = undefined;
		}

		for (let id in this.objs) {
			this.removeObj(this.objs[id]);
		}
	}
}

function uuidv4() {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  )
}

export {SharedFormats, LineShared, ArcShared, Angle, CurveShared, EquidArc, Roll};

