/**
 * Primitive class for LINE or ARC
 * @param {Object} values coordinates and other parameters of primitive
 * @param {String} type of primitive
 */
export default class Primitive {
    constructor(values, type = Primitive.types.LINE) {
        switch (type.toUpperCase()) {
            case Primitive.types.LINE:
                this.type = Primitive.types.LINE;
                this.x1 = values.x1;
                this.y1 = values.y1;
                this.z1 = values.z1;
                this.x2 = values.x2;
                this.y2 = values.y2;
                this.z2 = values.z2;
                break;
            case Primitive.types.ARC:
                this.type = Primitive.types.ARC;
                this.x = values.x;
                this.y = values.y;
                this.z = values.z;
                this.R = values.R;
                this.fi1 = values.fi1;
                this.fi2 = values.fi2;
                break;
            default:
                break;
        }
    }

    /**
     * get available primitive types
     * @returns {Object} object with available types
     */
    static get types() {
        return {
            LINE: 'LINE',
            ARC: 'ARC'
        };
    }
}
