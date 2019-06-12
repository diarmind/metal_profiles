function CreateShaft(element, points, width) {
	let axes = [{x: 75, y: 290, z: element.az}, {x: -20, y: 80, z: element.az}];
	// let axes = [{x: -90, y: 80, z: element.az}, {x: 90, y: 80, z: element.az}];
	axes = getAxis(points, 15);
	drawLine(axes);
	let surfaceCircles = CreateRotationSurface(points, axes);
	// CreateSurface(surfaceCircles);
}

function CreateRotationSurface(line, centralLine) {
	let bias = 5;
	let circles = [];
	let points = getCirclePoints(line[0].x, line[0].y, line[0].z, centralLine);
	circles.push([points]);

	let geometry = new THREE.BufferGeometry().setFromPoints( points );
	let material = new THREE.LineBasicMaterial( { color : 0xff0000 } );
	let ellipse = new THREE.Line( geometry, material );
	scene.add(ellipse);

	for (let i = 1; i < line.length - 1; i += 2) {
		let points = getCirclePoints(line[i].x, line[i].y, line[i].z, centralLine);
		circles.push([points]);
		let geometry = new THREE.BufferGeometry().setFromPoints( points );
		let material = new THREE.LineBasicMaterial( { color : 0xff0000 } );
		let ellipse = new THREE.Line( geometry, material );
		scene.add(ellipse);
	}

	points = getCirclePoints(line[line.length - 1].x, line[line.length - 1].y, line[line.length - 1].z, centralLine);
	circles.push([points]);
	geometry = new THREE.BufferGeometry().setFromPoints( points );
	ellipse = new THREE.Line( geometry, material );
	scene.add(ellipse);

	return circles;
}

function CreateSurface(circles) {
	let points = [];
	let indices = [];
	for (let i = 0; i < circles.length; i++) {
		for (let j = 0; j < circles[i][0].length; j++) {
			points.push(circles[i][0][j]);
		}
	}
	for (let i = 0; i < circles.length - 1; i++) {
		for (let j = 0; j < circles[i][0].length - 1; j++) {
			let base = circles[i][0].length * i + j;
			let a = base;
			let b = base + circles[i][0].length;
			let c = base + 1;
			let d = base + circles[i][0].length + 1;
			indices.push( a, c, d );
			indices.push( a, d, b );
		}
	}
	let geometry = new THREE.BufferGeometry().setFromPoints(points);
	geometry.setIndex( indices );
	geometry.computeVertexNormals();
	let mesh = new THREE.Mesh( geometry, material);
	scene.add(mesh);
}

function getCirclePoints(x, y, z, central) {
	let points = [];

	let v1 = {								//нахождение единиченого направляющего вектора оси
		x: central[1].x - central[0].x,
		y: central[1].y - central[0].y,
		z: central[1].z - central[0].z,
	};
	let v1mag = Math.sqrt(v1.x* v1.x + v1.y * v1.y + v1.z * v1.z);
	let i = [[
		v1.x / v1mag,
		v1.y / v1mag,
		v1.z / v1mag,
	]];
	let c_u = [[x, y, z]];					//точка на кривой
	//let p = [[central[0].x, central[0].y, central[0].z]];		//начальная точка оси
	let p = [[(central[0].x + central[1].x)/2, (central[0].y + central[1].y)/2, (central[0].z + central[1].z)/2]]

	let r3 = MultiplyMatrix(MultiplyMatrix(MinusMatrix(c_u, p), i), i);
	let r1 = MinusMatrix(MinusMatrix(c_u, p), r3);
	let r2 = MultiplyVector(i, MinusMatrix(c_u, p));

	let segments = 50;

	for (let v = 0; v <= segments; v ++) {						//проход по углам
		let segment = v / segments * Math.PI * 2;
		let r_v = SumMatrix(p, r3);
		r_v = SumMatrix(r_v, multMatrixNumber(Math.cos(segment), r1));
		r_v = SumMatrix(r_v, multMatrixNumber(Math.sin(segment), r2));
		points.push({x: r_v[0][0], y: r_v[0][1], z: r_v[0][2]});
	}

	let rep = true;
	points.push(points[0]);			//костыль для замыкания окружности
	return points;
}

function getAxis(points, bias) {
	let a1 = points[0];
	let a2 = points[points.length - 1];
	let v1 = {								//нахождение единиченого касательного вектора  для первой точки
		x: a1.x - a2.x,
		y: a1.y - a2.y,
		z: a1.z - a2.z,
	};

	let v1mag = Math.sqrt(v1.x * v1.x + v1.y * v1.y + v1.z * v1.z);
	let i = [[
		v1.x / v1mag,
		v1.y / v1mag,
		v1.z / v1mag,
	]];

	let v2 = [[0, 1, i[0][2]]];
	v2[0][0] = i[0][1] / i[0][0];

	let a1_new = SumMatrix(multMatrixNumber(bias, v2), [[a1.x, a1.y, a1.z]]);
	let a2_new = SumMatrix(multMatrixNumber(bias, v2), [[a2.x, a2.y, a2.z]]);

	// if (bias > 0) {
	// 	a1_new = multMatrixNumber(bias, a1_new);
	// 	a2_new = multMatrixNumber(bias, a2_new);
	// }

	let vertices = [new THREE.Vector3(a1_new[0][0], a1_new[0][1], a1_new[0][2]), new THREE.Vector3(a2_new[0][0], a2_new[0][1], a2_new[0][2])];
	return vertices;
}
