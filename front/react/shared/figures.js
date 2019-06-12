import {uuidv4} from "../utils/uuid.js";
import {CurveShared} from "./formats.js";


const FigureTypes = {
    ROLLER: 'roller',
    PROFILE: 'profile',
    LINE: 'line',
    ARC: 'arc',
};

class RollerFigure {
    /**
     * Construct the RollerFigure
     * @param {Object} obj
     * @param {CurveShared} obj.curve - curve primitive
     * @param {String} obj.axis_id - id reference for axis
     */
    constructor({curve, axis_id}) {
        this.curve = curve;
        this.axis_id = axis_id;

        this.type = FigureTypes.ROLLER;
        this.id = uuidv4();
    }
}

class ProfileFigure {
    /**
     * Construct the ProfileFigure
     * @param {Object} obj
     * @param {CurveShared} obj.curve - curve primitive
     */
    constructor({curve}) {
        this.curve = curve;

        this.type = FigureTypes.PROFILE;
        this.id = uuidv4();
    }
}

class LineFigure {
    /**
     * Construct the LineFigure
     * @param {Object} obj
     * @param {CurveShared} obj.curve - curve primitive
     */
    constructor({x1,y1,z1,x2,y2,z2}) {
        this.x1 = x1;
        this.x2 = x2;
        this.y1 = y1;
        this.y2 = y2;
        this.z1 = z1;
        this.z2 = z2;
        this.type = FigureTypes.LINE;
    }
}

class ArcFigure {
    /**
     * Construct the ArcFigure
     * @param {Object} obj
     * @param {CurveShared} obj.curve - curve primitive
     */
    constructor({x,y,z,R,fi_start, fi_end}) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.R = R;
        this.fi_start = fi_start;
        this.fi_end = fi_end;
        this.type = FigureTypes.ARC;
    }
}

export {RollerFigure, ProfileFigure, LineFigure, ArcFigure}
