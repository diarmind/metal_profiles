import * as THREE from 'three';
const defaultColor = 0x000000;

function drawLine(points, scene) {
	let g_line = new THREE.Geometry();

	g_line.vertices.push(new THREE.Vector3(points[0].x, points[0].y, points[0].z));

	for (let i = 0; i < points.length - 1; i++) {
		g_line.vertices.push(new THREE.Vector3(points[i].x, points[i].y, points[i].z))
		g_line.vertices.push(new THREE.Vector3(points[i].x, points[i].y, points[i].z))
	}
	g_line.vertices.push(new THREE.Vector3(points[points.length - 1].x, points[points.length - 1].y, points[points.length - 1].z));

	let line = new THREE.LineSegments(g_line, new THREE.LineBasicMaterial({color:defaultColor}));
	scene.add(line);
	return line;
}

function drawPoint(point) {
	let starsMaterial = new THREE.PointsMaterial( { color: 0x000000 } ); ///центр окружности
	let starsGeometry = new THREE.Geometry();
	starsGeometry.vertices.push(new THREE.Vector3(point.x, point.y, point.z));
	let starField = new THREE.Points( starsGeometry, starsMaterial );
	// scene.add(starField);
}

export {drawLine, drawPoint};
