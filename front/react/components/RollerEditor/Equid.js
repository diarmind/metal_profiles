"use strict";

let shaftShift = 3;		//коэф для свдига центра вала
let indent = 10;
import {TransMatrix, SumMatrix, MinusMatrix, multMatrixNumber, MultiplyMatrix, MultyplyMatrixVector, MatrixRoot, MultiplyVector, Determinant, radToDeg, degToRad} from './matrix.js';
import * as THREE from 'three';

function GetEquidPoints(element, line, bias) {
	let points_equid = [];		//массив точек на выход функции

	for (let j = 1; j < line.length - 1; j+= 1) {
		let point = getEquidistantPoint(line[j], line[j - 1], bias);
		points_equid.push(point);
	}

	let point = getEquidistantPoint(line[line.length - 2], line[line.length - 1], bias, 1);
	points_equid.push(point);
	
	point = getEquidistantPoint(line[line.length - 2], line[line.length - 1], indent);		//добавление отступов
	points_equid.push(point);
	point = getEquidistantPoint(line[1], line[0], indent, 1);
	points_equid.unshift(point);

	return points_equid;
}

function getEquidistantPoint(a, b, bias, revert) {
	let local_bias = bias;
	let v1 = {};
	let r_b = [[b.x, b.y, b.z]];
	v1 = {								//нахождение единиченого касательного вектора  для первой точки
		x: a.x - b.x,
		y: a.y - b.y,
		z: a.z - b.z,
	};
	let v1mag = Math.sqrt(v1.x* v1.x + v1.y * v1.y + v1.z * v1.z);
	let i = [[
		v1.x / v1mag,
		v1.y / v1mag,
		v1.z / v1mag,
	]];
	let a_t = [[0,0, revert ? -local_bias : local_bias]];
	let r_t = SumMatrix(r_b, MultiplyVector(a_t, i));
	let result = new THREE.Vector3(r_t[0][0], r_t[0][1], b.z);		//a.z т.к. неизбежны погрешности во время вычислений, их их необходимо устранить
	let a_t_revert = [[0,0, -local_bias]];
	//let r_t_rever = SumMatrix(r_b, MultiplyVector(a_t_revert, i));
	//let result_revert = new THREE.Vector3(r_t_revert[0][0], r_t_revert[0][1], b.z);
	//return [result, result_revert];
	return result;
}

function getVectorsAngle(a, b, o) {
	let v_a = {								//нахождение единиченого касательного вектора  для первой точки
		x: a.x - o.x,
		y: a.y - o.y,
		z: a.z - o.z,
	};
	let v_b = {								//нахождение единиченого касательного вектора  для первой точки
		x: b.x - o.x,
		y: b.y - o.y,
		z: b.z - o.z,
	};

	let a_l = Math.sqrt(v_a.x * v_a.x + v_a.y * v_a.y + v_a.z * v_a.z);
	let b_l = Math.sqrt(v_b.x * v_b.x + v_b.y * v_b.y + v_b.z * v_b.z);
	let scalarMulty = v_a.x * v_b.x + v_a.y * v_b.y + v_a.z * v_a.z;
	let angle_cos = scalarMulty / (a_l * b_l);
	return angle_cos;
}

function CreateIndent(element, points, points_equid) {
	let position_matrix = [
		[Math.cos(degToRad(element.aa)), -Math.sin(degToRad(element.aa)), points[points.length - 1].x],
		[Math.sin(degToRad(element.aa)), Math.cos(degToRad(element.aa)), points[points.length - 1].y],
		[0,0,1],
	];

	let p = MultyplyMatrixVector(position_matrix, [indent, 0, 1]);
	points_equid.push({x: p[0], y: p[1], z: p[2]});
}

function getAngleLen({theta, radius}) {
	let alpha = theta / 2;		//угол у первой прямой
	let alpha_t = (180 - theta) / 2;
	let betta = alpha;					//угол у второй прямой
	let betta_t = alpha_t;
	let gamma = 180 - theta;			//угол между прямыми
	// let c = radius * Math.sin(degToRad(theta)) / Math.sin(degToRad(alpha_t));
	// let a = c * Math.sin(degToRad(alpha)) / Math.sin(degToRad(gamma));
	let c = radius * Math.sin(degToRad(theta)) / Math.sin(degToRad(alpha_t));
	let a = c * Math.sin(degToRad(alpha)) / Math.sin(degToRad(gamma));
	let b = a;

	// //поворачиваем систему координат на угол альфа
	// let working_position_matrix = [
	// 	[Math.cos(degToRad(alpha)), -Math.sin(degToRad(alpha)), pointA.x],
	// 	[Math.sin(degToRad(alpha)), Math.cos(degToRad(alpha)), pointA.y],
	// 	[0,0,1],
	// ];

	// let new_point = MultyplyMatrixVector(working_position_matrix, [a, 0, 0]);
	return a;
}

function getUnitVector(p1, p2) {
	let v_d = {
		x: p1.x - p2.x,
		y: p1.y - p2.y,
		z: p1.z - p2.z,
	};
	let v_l = Math.sqrt(v_d.x * v_d.x + v_d.y * v_d.y + v_d.z * v_d.z);

	let v_unit = {
		x: v_d.x / v_l,
		y: v_d.y / v_l,
		z: v_d.z / v_l,
	};
	return v_unit;
}

export {GetEquidPoints, getEquidistantPoint, getVectorsAngle, CreateIndent, getAngleLen, getUnitVector};
