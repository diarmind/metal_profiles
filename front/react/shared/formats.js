import {uuidv4} from "../utils/uuid.js";


const SharedFormats = {
    VECTOR: 'vector',
    LINE: 'line',
    ARC: 'arc',
    CURVE: 'curve',
};


class VectorShared {
    /**
     * Construct the VectorShared
     * @param {Object} obj
     * @param {Number} obj.x - x coordinate
     * @param {Number} obj.y - y coordinate
     * @param {Number} obj.z - z coordinate
     */
	constructor({x,y,z}) {
		this.x = x;
		this.y = y;
		this.z = z;

		this.type = SharedFormats.VECTOR;
		this.id = uuidv4();
	}
}


class LineShared {
    /**
     * Construct the LineShared
     * @param {Object} obj
     * @param {Number} obj.x1 - x coordinate of start point vector
     * @param {Number} obj.y1 - y coordinate of start point vector
     * @param {Number} obj.z1 - z coordinate of start point vector
     * @param {Number} obj.x2 - x coordinate of end point vector
     * @param {Number} obj.y2 - y coordinate of end point vector
     * @param {Number} obj.z2 - z coordinate of end point vector
     * @param {String} obj.id - set id manually
     */
	constructor({x1, y1, z1, x2, y2, z2, id = null}) {
		this.x1 = x1;
		this.x2 = x2;
		this.y1 = y1;
		this.y2 = y2;
		this.z1 = z1;
		this.z2 = z2;

		this.type = SharedFormats.LINE;
		this.id = id || uuidv4();
	}

    /**
     * Get the length of the line
     * @returns {number}
     */
	length() {
		let d_x = this.x1 - this.x2;
		let d_y = this.y1 - this.y2;
		let d_z = this.z1 - this.z2;
		return Math.sqrt(d_x * d_x + d_y * d_y + d_z * d_z);
	}

    /**
     * Get vectors to the start and end points of the line
     * @returns {VectorShared[]}
     */
	getVectors() {
        return [
            new VectorShared({
                x: this.x1,
                y: this.y1,
                z: this.z1
            }),
            new VectorShared({
                x: this.x2,
                y: this.y2,
                z: this.z2
            })
        ];
	}

    /**
     * Construct the LineShared from 2 VectorShared
     * @param {VectorShared} vec1 - start point vector
     * @param {VectorShared} vec2 - end point vector
     * @param {String} id - set id manually
     */
	static fromVectors(vec1, vec2, id = null) {
	    return new LineShared({
            x1: vec1.x,
            y1: vec1.y,
            z1: vec1.z,
            x2: vec2.x,
            y2: vec2.y,
            z2: vec2.z,
            id: id,
        })
    }
}


const ArcDirections = {
	CLOCKWISE: 'clockwise',
	COUNTERCLOCKWISE: 'counterclockwise'
};

class ArcShared {
    /**
     * Constructs the ArcShared
     * @param {Object} obj
     * @param {Number} obj.x - x coordinate of arc center
     * @param {Number} obj.y - y coordinate of arc center
     * @param {Number} obj.z - z coordinate of arc center
     * @param {Number} obj.R - arc radius
     * @param {Number} obj.fi_start - start angle
     * @param {Number} obj.fi_end - end angle
	 * @param {ArcDirections.CLOCKWISE | ArcDirections.CLOCKWISE} obj.direction - arc direction
     */
	constructor({x, y, z, R, fi_start, fi_end, direction = ArcDirections.COUNTERCLOCKWISE}) {
		this.x = x;
		this.y = y;
		this.z = z;
		this.R = R;
		this.fi_start = fi_start;
		this.fi_end = fi_end;
		this.direction = direction;

		this.type = SharedFormats.ARC;
		this.id = uuidv4();
	}
}


class CurveShared {
    /**
     * Constructs CurveShared
     * @param {Object} obj
     * @param {(LineShared|ArcShared)[]} obj.primitives - primitives
     */
	constructor({primitives}) {
		this.primitives = primitives;

		this.type = SharedFormats.CURVE;
		this.id = uuidv4();
	}

    /**
     * Add primitive to the end of primitives array
     * @param {LineShared|ArcShared} primitive
     */
	push(primitive) {
		this.primitives.push(primitive);
	}

    /**
     * Add primitive to the start of primitives array
     * @param {LineShared|ArcShared} primitive
     */
	unshift(primitive) {
		this.primitives.unshift(primitive);
	}
}

export {VectorShared, LineShared, ArcShared, CurveShared, SharedFormats, ArcDirections};
