function buildFromLRA(element, bias) {
	let ExternalEquidCurve = new CurveShared([]);
	let MainCurve = new CurveShared([]);
	let InteriorEquidCurve = new CurveShared([]);
	let working_position_matrix = [];
	let p0 =[], p1 = [];
	let rotation_angle = element.aa;
	let startRotationAngle = rotation_angle;

	let position_matrix = [
		[Math.cos(degToRad(element.aa)), -Math.sin(degToRad(element.aa)), element.ax],
		[Math.sin(degToRad(element.aa)), Math.cos(degToRad(element.aa)), element.ay],
		[0,0,1],
	];

	let line_num = Math.trunc(element.ac) - 1;
	if(element.A[line_num] == 0) {
		p0 = MultyplyMatrixVector(position_matrix, [element.L[line_num] * (-(element.ac - Math.trunc(element.ac))), 0, 1]);
		p1 = MultyplyMatrixVector(position_matrix, [element.L[line_num] * (Math.trunc(element.ac) + 1 - element.ac), 0, 1]);

		let l = new LineShared({x1: p0[0], y1: p0[1], z1: element.az, x2: p1[0], y2: p1[1], z2: element.az});
		MainCurve.push(l);
		InteriorEquidCurve.push(l.getEquid({revert: true, equidType: SharedFormats.InteriorEquid}));
		ExternalEquidCurve.push(l.getEquid({revert: false, equidType: SharedFormats.ExternalEquid}));

		working_position_matrix = [
			[Math.cos(degToRad(element.aa)), -Math.sin(degToRad(element.aa)), p1[0]],
			[Math.sin(degToRad(element.aa)), Math.cos(degToRad(element.aa)), p1[1]],
			[0,0,1],
		];
	} else {
		let c_x = 0;
		let c_y, aStartAngle, aClockwise, aEndAngle;

		let c_new = MultyplyMatrixVector(position_matrix, [0, c_y, 1]);		//добавляем в массив объектов круг
		let arc;	
		if (element.A[line_num] >= 0) {
			c_y = element.R[line_num];
			aEndAngle = 3 * Math.PI / 2 + degToRad(rotation_angle + element.A[line_num] * (Math.trunc(element.ac) + 1 - element.ac));
			aStartAngle = 3 * Math.PI / 2 + degToRad(rotation_angle - element.A[line_num] * (Math.trunc(element.ac) + 1 - element.ac));
		} else {
			c_y = -element.R[line_num];
			aStartAngle = Math.PI / 2 + degToRad(rotation_angle + element.A[line_num] * (Math.trunc(element.ac) + 1 - element.ac));
			aEndAngle = Math.PI / 2 + degToRad(rotation_angle - element.A[line_num] * (Math.trunc(element.ac) + 1 - element.ac));
		}

		arc = new ArcShared ({
			x: c_new[0], y: c_new[1], z: element.az,
			R: element.R[line_num],
			fi_start: aStartAngle, fi_end: aEndAngle
			}
		);

		MainCurve.push(arc);
		let arc_equid_ext = new ArcShared ({
			x: c_new[0], y: c_new[1], z: element.az,
			R: element.A[line_num] > 0 ? element.R[line_num] + globalBias : element.R[line_num] - globalBias,
			fi_start: aStartAngle, fi_end: aEndAngle, equidArc: true
			}
		);
		let arc_equid_int = new ArcShared ({
			x: c_new[0], y: c_new[1], z: element.az,
			R: element.A[line_num] > 0 ? element.R[line_num] - globalBias : element.R[line_num] + globalBias,
			fi_start: aStartAngle, fi_end: aEndAngle, equidArc: true
			}
		);
		let offset = getAngleLen({theta: element.A[line_num], radius: element.R[line_num] + globalBias});
		let arc_equid_ext_points = element.A[line_num] > 0 ? arc_equid_ext.getPoints() : arc_equid_int.getPoints();

		rotation_angle += element.A[line_num] * (Math.trunc(element.ac) + 1 - element.ac);
		startRotationAngle = rotation_angle - element.A[line_num];

		let offset_p = MultyplyMatrixVector(
			[
				[Math.cos(degToRad(startRotationAngle)), -Math.sin(degToRad(startRotationAngle)),  element.A[line_num] > 0 ? arc_equid_ext_points[0].x : arc_equid_ext_points[arc_equid_ext_points.length - 1].x],
				[Math.sin(degToRad(startRotationAngle)), Math.cos(degToRad(startRotationAngle)), element.A[line_num] > 0 ? arc_equid_ext_points[0].y : arc_equid_ext_points[arc_equid_ext_points.length - 1].y],
				[0,0,1],
			],
			[element.A[line_num] > 0 ? offset : -offset, 0, 1]

		);

		let equidAngle = new Angle(
			{
				x1 : arc_equid_ext_points[0].x,
				x2 : offset_p[0],
				x3 : arc_equid_ext_points[arc_equid_ext_points.length - 1].x,
				y1 : arc_equid_ext_points[0].y,
				y2 : offset_p[1],
				y3 : arc_equid_ext_points[arc_equid_ext_points.length - 1].y,
				z1 : element.az,
				z2 : element.az,
				z3 : element.az,
			}
		);

		let externalAngle = element.A[line_num] > 0 ? equidAngle : {};
		let internalAngle = element.A[line_num] > 0 ? {} : equidAngle;

		ExternalEquidCurve.push(new EquidArc({Arc: arc_equid_ext, Angle: externalAngle, inUse: SharedFormats.ARC, equidType: SharedFormats.ExternalEquid}));
		InteriorEquidCurve.push(new EquidArc({Arc: arc_equid_int, Angle: internalAngle, inUse: SharedFormats.ARC, equidType: SharedFormats.InteriorEquid}));
		let arcPoints = arc.getPoints();
		let newP = element.A[line_num] > 0 ? arcPoints[arcPoints.length - 1]: arcPoints[0]

		if(element.A[line_num] > 0) {
			p0[0] = arcPoints[0].x;
			p0[1] = arcPoints[0].y;
		} else {
			p0[0] = arcPoints[arcPoints.length - 1].x;
			p0[1] = arcPoints[arcPoints.length - 1].y;
		}

		working_position_matrix = [
			[Math.cos(degToRad(rotation_angle)), -Math.sin(degToRad(rotation_angle)), newP.x],
			[Math.sin(degToRad(rotation_angle)), Math.cos(degToRad(rotation_angle)), newP.y],
			[0,0,1],
		];
	}

	for (let i = line_num + 1; i < element.L.length; i++) {
		if (element.R[i] != 0 || element.A[i] != 0) {
			let c_x = 0;
			let c_y, aStartAngle, aClockwise, aEndAngle;

			let arc;	
			if (element.A[i] >= 0) {
				c_y = element.R[i];
				aStartAngle = 3 * Math.PI / 2 + degToRad(rotation_angle);
				aEndAngle = aStartAngle + degToRad(element.A[i]);
			} else {
				c_y = -element.R[i];
				aEndAngle = Math.PI / 2 + degToRad(rotation_angle);
				aStartAngle = aEndAngle + degToRad(element.A[i]);
			}

			let c_new = MultyplyMatrixVector(working_position_matrix, [0, c_y, 1]);		//добавляем в массив объектов круг

			arc = new ArcShared ({
				x: c_new[0], y: c_new[1], z: element.az,
				R: element.R[i],
				fi_start: aStartAngle, fi_end: aEndAngle
				}
			);

			MainCurve.push(arc);
			let arc_equid_ext = new ArcShared ({
				x: c_new[0], y: c_new[1], z: element.az,
				R: element.A[i] > 0 ? element.R[i] + globalBias : element.R[i] - globalBias,
				fi_start: aStartAngle, fi_end: aEndAngle, equidArc: true
				}
			);
			let arc_equid_int = new ArcShared ({
				x: c_new[0], y: c_new[1], z: element.az,
				R: element.A[i] > 0 ? element.R[i] - globalBias : element.R[i] + globalBias,
				fi_start: aStartAngle, fi_end: aEndAngle, equidArc: true
				}
			);
			let offset = getAngleLen({theta: element.A[i], radius: element.R[i] + globalBias});

			let lineForOffset = element.A[i] > 0 ? ExternalEquidCurve.objs[ExternalEquidCurve.objs.length - 1].obj : InteriorEquidCurve.objs[InteriorEquidCurve.objs.length - 1].obj;

			let arc_equid_points = element.A[i] > 0 ? arc_equid_ext.getPoints() : arc_equid_int.getPoints();

			let offset_p = MultyplyMatrixVector(
				[
					[Math.cos(degToRad(rotation_angle)), -Math.sin(degToRad(rotation_angle)), element.A[i] > 0 ? arc_equid_points[0].x : arc_equid_points[arc_equid_points.length - 1].x],
					[Math.sin(degToRad(rotation_angle)), Math.cos(degToRad(rotation_angle)), element.A[i] > 0 ? arc_equid_points[0].y : arc_equid_points[arc_equid_points.length - 1].y],
					[0,0,1],
				],
				[element.A[i] > 0 ? offset : -offset, 0, 1]
			);

			let equidAngle = new Angle(
				{
					x1 : arc_equid_points[0].x,
					x2 : offset_p[0],
					x3 : arc_equid_points[arc_equid_points.length - 1].x,
					y1 : arc_equid_points[0].y,
					y2 : offset_p[1],
					y3 : arc_equid_points[arc_equid_points.length - 1].y,
					z1 : element.az,
					z2 : element.az,
					z3 : element.az,
				}
			);

			let externalAngle = element.A[i] > 0 ? equidAngle : {};
			let internalAngle = element.A[i] > 0 ? {} : equidAngle;
			ExternalEquidCurve.push(new EquidArc({Arc: arc_equid_ext, Angle: externalAngle, inUse: SharedFormats.ARC, equidType: SharedFormats.ExternalEquid}));
			InteriorEquidCurve.push(new EquidArc({Arc: arc_equid_int, Angle: internalAngle, inUse: SharedFormats.ARC, equidType: SharedFormats.InteriorEquid}));
			rotation_angle += element.A[i];
			let arcPoints = arc.getPoints();
			let newP = element.A[i] > 0 ? arcPoints[arcPoints.length - 1]: arcPoints[0]
			working_position_matrix = [
				[Math.cos(degToRad(rotation_angle)), -Math.sin(degToRad(rotation_angle)), newP.x],
				[Math.sin(degToRad(rotation_angle)), Math.cos(degToRad(rotation_angle)), newP.y],
				[0,0,1],
			];
		} else if (element.L[i] != 0) {
			let p = MultyplyMatrixVector(working_position_matrix, [element.L[i], 0, 1]);
			let line = new LineShared(
					{
						x2: p[0], y2: p[1], z2: element.az,
						x1: working_position_matrix[0][2],
						y1: working_position_matrix[1][2],
						z1: element.az
					}
			);
			MainCurve.push(line);

			InteriorEquidCurve.push(line.getEquid({revert: true, equidType: SharedFormats.InteriorEquid}));
			ExternalEquidCurve.push(line.getEquid({revert: false, equidType: SharedFormats.ExternalEquid}));
			working_position_matrix = [
				[Math.cos(degToRad(rotation_angle)), -Math.sin(degToRad(rotation_angle)), p[0]],
				[Math.sin(degToRad(rotation_angle)), Math.cos(degToRad(rotation_angle)), p[1]],
				[0,0,1],
			];
		}
	}

	rotation_angle = startRotationAngle;
	working_position_matrix = [
		[Math.cos(degToRad(startRotationAngle)), -Math.sin(degToRad(startRotationAngle)), p0[0]],
		[Math.sin(degToRad(startRotationAngle)), Math.cos(degToRad(startRotationAngle)), p0[1]],
		[0,0,1],
	];
console.log(working_position_matrix);
drawPoint({x: working_position_matrix[0][2], y: working_position_matrix[1][2], z:0})
//обратный проход

	for (let i = line_num - 1; i >= 0; i--) {
		if (element.R[i] != 0) {
			let c_x = 0;
			let c_y, aStartAngle, aClockwise, aEndAngle;

			if (element.A[i] >= 0) {
				c_y = element.R[i];
				aEndAngle = 3 * Math.PI / 2 + degToRad(rotation_angle);
				aStartAngle = aEndAngle - degToRad(element.A[i]);
			} else {
				c_y = -element.R[i];
				aStartAngle = Math.PI / 2 + degToRad(rotation_angle);
				aEndAngle = aStartAngle - degToRad(element.A[i]);
			}
			let c_new = MultyplyMatrixVector(working_position_matrix, [c_x, c_y, 1]);		//добавляем в массив объектов круг
			let arc = new ArcShared ({
				x: c_new[0], y: c_new[1], z: element.az,
				R: element.R[i],
				fi_start: aStartAngle, fi_end: aEndAngle
				}
			);

			MainCurve.unshift(arc);
			let arc_equid_ext = new ArcShared ({
				x: c_new[0], y: c_new[1], z: element.az,
				R: element.A[i] > 0 ? element.R[i] + globalBias : element.R[i] - globalBias,
				fi_start: aStartAngle, fi_end: aEndAngle, equidArc: true
				}
			);
			let arc_equid_int = new ArcShared ({
				x: c_new[0], y: c_new[1], z: element.az,
				R: element.A[i] > 0 ? element.R[i] - globalBias : element.R[i] + globalBias,
				fi_start: aStartAngle, fi_end: aEndAngle, equidArc: true
				}
			);

			let offset = getAngleLen({theta: element.A[i], radius: element.R[i] + globalBias});
			let lineForOffset = element.A[i] > 0 ? ExternalEquidCurve.objs[0].obj : InteriorEquidCurve.objs[0].obj;

			let arc_equid_points = element.A[i] > 0 ? arc_equid_ext.getPoints() : arc_equid_int.getPoints();

			let offset_p = MultyplyMatrixVector(
				[
					[Math.cos(degToRad(rotation_angle)), -Math.sin(degToRad(rotation_angle)),  element.A[i] > 0 ? arc_equid_points[arc_equid_points.length - 1].x : arc_equid_points[0].x],
					[Math.sin(degToRad(rotation_angle)), Math.cos(degToRad(rotation_angle)), element.A[i] > 0 ? arc_equid_points[arc_equid_points.length - 1].y : arc_equid_points[0].y],
					[0,0,1],
				],
				[element.A[i] > 0 ? -offset : offset, 0, 1]
			);
			let equidAngle = new Angle(
				{
					x1 : arc_equid_points[0].x,
					x2 : offset_p[0],
					x3 : arc_equid_points[arc_equid_points.length - 1].x,
					y1 : arc_equid_points[0].y,
					y2 : offset_p[1],
					y3 : arc_equid_points[arc_equid_points.length - 1].y,
					z1 : element.az,
					z2 : element.az,
					z3 : element.az,
				}
			);

			let extAngle = element.A[i] > 0 ? equidAngle : {};
			let intAngle = element.A[i] > 0 ? {} : equidAngle;
			ExternalEquidCurve.unshift(new EquidArc({Arc: arc_equid_ext, Angle: extAngle, inUse: SharedFormats.ARC, equidType : SharedFormats.ExternalEquid}));
			InteriorEquidCurve.unshift(new EquidArc({Arc: arc_equid_int, Angle: intAngle, inUse: SharedFormats.ARC, equidType : SharedFormats.InteriorEquid}));

			rotation_angle -= element.A[i];
			let arcPoints = arc.getPoints();
			let newP = element.A[i] > 0 ? arcPoints[0]: arcPoints[arcPoints.length - 1]
			working_position_matrix = [
				[Math.cos(degToRad(rotation_angle)), -Math.sin(degToRad(rotation_angle)), newP.x],
				[Math.sin(degToRad(rotation_angle)), Math.cos(degToRad(rotation_angle)), newP.y],
				[0,0,1],
			];
		} else if (element.L[i] != 0) {
			let p = MultyplyMatrixVector(working_position_matrix, [-element.L[i], 0, 1]);
			let line = new LineShared(
					{
						x2: p[0], y2: p[1], z2: element.az,
						x1: working_position_matrix[0][2],
						y1: working_position_matrix[1][2],
						z1: element.az
					}
			);
			MainCurve.unshift(line);

			InteriorEquidCurve.unshift(line.getEquid({revert: false, equidType: SharedFormats.InteriorEquid}));
			ExternalEquidCurve.unshift(line.getEquid({revert: true, equidType: SharedFormats.ExternalEquid}));
			working_position_matrix = [
				[Math.cos(degToRad(rotation_angle)), -Math.sin(degToRad(rotation_angle)), p[0]],
				[Math.sin(degToRad(rotation_angle)), Math.cos(degToRad(rotation_angle)), p[1]],
				[0,0,1],
			];
		}
	}

	InteriorEquidCurve.objs[0].obj.addListener();
	InteriorEquidCurve.objs[InteriorEquidCurve.objs.length - 1].obj.addListener();
	ExternalEquidCurve.objs[0].obj.addListener();
	ExternalEquidCurve.objs[ExternalEquidCurve.objs.length - 1].obj.addListener();

	return [MainCurve, InteriorEquidCurve, ExternalEquidCurve];
}

export {buildFromLRA};