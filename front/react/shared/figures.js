import {uuidv4} from "../utils/uuid.js";
import {CurveShared} from "./formats.js";


const FigureTypes = {
    ROLLER: 'roller',
    PROFILE: 'profile',
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

export {RollerFigure, ProfileFigure, FigureTypes}
