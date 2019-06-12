/**
 * Dxf file class.
 * version of dxf - AC1009 (R12/LT2 DXF)
 */
export default class Dxf { 
    constructor() {
        this._VportHeight = 200;
        this._header;
        this._MaxAbsY;
        this._end;
        this._entities = [];
        this._layers = [];
        this.addDxfPoint = this.addDxfPoint.bind(this);
        this.addDxfLine = this.addDxfLine.bind(this);
        this.addDxfArc = this.addDxfArc.bind(this);
        this.addDxfCircle = this.addDxfCircle.bind(this);
    }

    /**
     * Get dxf file as string
     * @returns {String} file body
     */
    get body() {
        let result;
        result = this._getDxfHeader();
        result += this._entities.join('');
        result += this._getDxfEnd();
        return result;
    }

    /**
     * VportHeight getter
     * @returns {number} VPORT_HEIGHT value
     */
    get VportHeight() {
        return this._VportHeight;
    }

    /**
     * VportHeight setter
     * @param {number} value new Vport height
     */
    set VportHeight(value) {
        if (!isNaN(value)) {
            this._VportHeight = Number(value);
        }
    }

    /**
     * Pushing layers for result file. If a layer with a layerName exists, it will be overwritten with the new one.
     * @param {*} layer new layer data
     * @param {String} layer.layerName name of new layer
     * @param {String} [layer.lineType=Dxf.lineTypes.CONTINUOUS] style of new layer lines. Should be instance of `Dxf.lineTypes`
     * @param {Number} [layer.layerColor=Dxf.color.WHITE] color of lines on new layer. Should be instance of `Dxf.colors`
     */
    addLayer({layerName, lineType, layerColor}) {
        if (!layerName) {
            return;
        }
        const index = this._layers.findIndex(el => el.layerName === layerName);
        if (index < 0) {
            this._layers.push({layerName, lineType, layerColor});
        } else {
            this._layers[index] = {layerName, lineType, layerColor};
        }
    }

    /**
     * get available AutoCAD colors
     * <ul>
     * <li>BLACK</li>
     * <li>RED</li>
     * <li>YELLOW</li>
     * <li>GREEN</li>
     * <li>AQUA</li>
     * <li>BLUE</li>
     * <li>MAGENTA</li>
     * <li>WHITE</li>
     * <li>GRAY</li>
     * <li>GREY</li>
     * </ul>
     * @returns {Object} object with available colors
     */
    static get colors() {
        return {
            BLACK: 250,
            RED: 1,
            YELLOW: 2,
            GREEN: 3,
            CYAN: 4,
            BLUE: 5,
            MAGENTA: 6,
            WHITE: 7,
            GRAY: 8,
            GREY: 9
        };
    }

    /**
     * get available drawing line types
     * <ul>
     * <li>CONTINUOUS / Сплошная — ( ⸻⸻ )</li>
     * <li>LONG_DASHED_DOTTED / Штрихпунктирная — ( ⸺ .⸺ . ⸺ . ⸺ )</li>
     * </ul>
     * @returns {Object} object with available line types
     */
    static get lineTypes() {
        return {
            CONTINUOUS: 'CONTINUOUS',
            LONG_DASHED_DOTTED: 'LONG_DASHED_DOTTED',
        };
    }

    /**
     * Return dxf header block string
     * @private
     */
    _getDxfHeader() {
        if (!isNaN(this._MaxAbsY)) {
            this._VportHeight = 2 * 1.2 * this._MaxAbsY;
        }
        let header = '';
        //  HEADER
        for (let str of headerSection) {
            header += str + '\n';
        }

        //  TABLES
        for (let str of tablesSectionStart) {
            header += str + '\n';
        }

        //  VPORT part 1
        for (let str of vportTable_Part1) {
            header += str + '\n';
        }
        header += `${this._VportHeight}\n`;
        //  VPORT part 2
        for (let str of vportTable_Part2) {
            header += str + '\n';
        }

        //  LINES
        for (let str of linesTable) {
            header += str + '\n';
        }

        //  LAYERS
        header += '0\n';
        header += 'TABLE\n';
        header += '2\n';
        header += 'LAYER\n';
        header += '70\n';
        header += `${this._layers.length + 1}\n`;
        // add default layer (0)
        header += '0\n';
        header += 'LAYER\n';
        header += '2\n';
        header += '0\n';
        header += '70\n';
        header += '0\n';
        header += '62\n';
        header += '7\n';
        header += '6\n';
        header += 'CONTINUOUS\n';
        for (const layer of this._layers) {
            header += '0\n';
            header += 'LAYER\n';
            header += '2\n';
            header += `${layer.layerName}\n`;
            header += '70\n';
            header += '0\n';
            header += '6\n';
            if (layer.lineType) {
                header += `${layer.lineType}\n`;
            } else {
                header += `${Dxf.lineTypes.CONTINUOUS}\n`;
            }
            header += '62\n';
            if (!isNaN(layer.layerColor) && layer.layerColor > 0 && layer.layerColor <=255) {
                header += `${layer.layerColor}\n`;
            } else {
                header += '7\n'; // white color
            }
        }
        header += '0\n';
        header += 'ENDTAB\n';
        //END LAYERS

        //  TABLES ENDSEC
        for (let str of tablesSectionEnd) {
            header += str + '\n';
        }

        // ENTITIES
        for (let str of entitiesSectionStart) {
            header += str + '\n';
        }
        return header;
    }

    /**
     * Return dxf end block string
     * @private
     */
    _getDxfEnd() {
        let str = '';
        str += '0\n';
        str += 'ENDSEC\n';
        str += '0\n';
        str += 'EOF\n';
        return str;
    }

    _updateMaxY(newMaxY) {
        if (newMaxY > this._MaxAbsY || this._MaxAbsY === undefined || this._MaxAbsY === null) {
            this._MaxAbsY = newMaxY;
        }
    }

    /**
     * Add POINT to entities section in dxf
     * 
     * @param {Number} x coordinate `x`
     * @param {Number} y coordinate `y`
     * @param {Number} z coordinate `z`
     * @param {String} layer the name of the layer to place the object
     */
    addDxfPoint(x, y, z, layer='default_layer') {
        if (isNaN(Number(x)) || isNaN(Number(y)) || isNaN(Number(z))) {
            throw new Error('Wrong data format');
        }
        this._updateMaxY(Math.abs(y));
        let entity = '';
        entity += '0\n';
        entity += 'POINT\n';
        entity += '8\n';
        entity += layer + '\n';
        entity += '10\n';
        entity += x + '\n';
        entity += '20\n';
        entity += y + '\n';
        entity += '30\n';
        entity += z + '\n';
        this._entities.push(entity);
    }

    /**
     * Add LINE to entities section in dxf
     * 
     * @param {Number} x1 coordinate `x` of first point
     * @param {Number} y1 coordinate `y` of first point
     * @param {Number} z1 coordinate `z` of first point
     * @param {Number} x2 coordinate `x` of second point
     * @param {Number} y2 coordinate `y` of second point
     * @param {Number} z2 coordinate `z` of second point
     * @param {String} layer the name of the layer to place the object
     */
    addDxfLine(x1, y1, z1, x2, y2, z2, layer='default_layer') {
        if (isNaN(Number(x1)) || isNaN(Number(y1)) || isNaN(Number(z1)) || isNaN(Number(x2)) || isNaN(Number(y2)) || isNaN(Number(z2))) {
            throw new Error('Wrong data format');
        }
        this._updateMaxY(Math.max(Math.abs(y1), Math.abs(y2)));
        let entity = '';
        entity += '0\n';
        entity += 'LINE\n';
        entity += '8\n';
        entity += layer + '\n';
        entity += '10\n';
        entity += x1 + '\n';
        entity += '20\n';
        entity += y1 + '\n';
        entity += '30\n';
        entity += z1 + '\n';
        entity += '11\n';
        entity += x2 + '\n';
        entity += '21\n';
        entity += y2 + '\n';
        entity += '31\n';
        entity += z2 + '\n';
        this._entities.push(entity);
    }

    /**
     * Add ARC to entities section in dxf
     * 
     * @param {Number} x coordinate `x` of center of the arc
     * @param {Number} y coordinate `y` of center of the arc
     * @param {Number} z coordinate `z` of center of the arc
     * @param {Number} R radius of the arc
     * @param {Number} fi_start start angle of the arc
     * @param {Number} fi_end end angle of the arc
     * @param {String} layer the name of the layer to place the object
     */
    addDxfArc(x, y, z, R, fi_start, fi_end, layer='default_layer') {
        if (isNaN(Number(x)) || isNaN(Number(y)) || isNaN(Number(z)) || isNaN(Number(R)) || isNaN(Number(fi_start)) || isNaN(Number(fi_end))) {
            throw new Error('Wrong data format');
        }
        if (R < 0) {
            throw new Error('Radius shouldn`t be negative');
        }
        this._updateMaxY(Math.abs(y + (Math.sign(y) | 1) * R));
        let entity = '';
        entity += '0\n';
        entity += 'ARC\n';
        entity += '8\n';
        entity += layer + '\n';
        entity += '10\n';
        entity += x + '\n';
        entity += '20\n';
        entity += y + '\n';
        entity += '30\n';
        entity += z + '\n';
        entity += '40\n';
        entity += R + '\n';
        entity += '50\n';
        entity += fi_start + '\n';
        entity += '51\n';
        entity += fi_end + '\n';
        this._entities.push(entity);
    }

    /**
     * Add CIRCLE to entities section in dxf
     * 
     * @param {Number} x coordinate `x` of center of the circle
     * @param {Number} y coordinate `y` of center of the circle
     * @param {Number} z coordinate `z` of center of the circle
     * @param {Number} R radius of the circle
     * @param {String} layer the name of the layer to place the object
     */
    addDxfCircle(x, y, z, R, layer='default_layer') {
        if (isNaN(Number(x)) || isNaN(Number(y)) || isNaN(Number(z)) || isNaN(Number(R))) {
            throw new Error('Wrong data format');
        }
        if (R < 0) {
            throw new Error('Radius shouldn`t be negative');
        }
        this._updateMaxY(Math.abs(y + (Math.sign(y) | 1) * R));
        let entity = '';
        entity += '0\n';
        entity += 'CIRCLE\n';
        entity += '8\n';
        entity += layer + '\n';
        entity += '10\n';
        entity += x + '\n';
        entity += '20\n';
        entity += y + '\n';
        entity += '30\n';
        entity += z + '\n';
        entity += '40\n';
        entity += R + '\n';
        this._entities.push(entity);
    }

    /**
     * Add entity to entities section of dxf
     * @param {String} entity entity as string in dxf format
     */
    addDxfEntity(entity) {
        this._entities.push(entity);
    }

    /**
     * Get POINT as dxf entity section string
     * 
     * @param {Number} x coordinate `x`
     * @param {Number} y coordinate `y`
     * @param {Number} z coordinate `z`
     * @param {String} layer the name of the layer to place the object
     * @returns {String} entity as dxf string
     */
    static getDxfPoint(x, y, z, layer='default_layer') {
        if (isNaN(Number(x)) || isNaN(Number(y)) || isNaN(Number(z))) {
            throw new Error('Wrong data format');
        }
        let entity = '';
        entity += '0\n';
        entity += 'POINT\n';
        entity += '8\n';
        entity += layer + '\n';
        entity += '10\n';
        entity += x + '\n';
        entity += '20\n';
        entity += y + '\n';
        entity += '30\n';
        entity += z + '\n';
        return entity;
    }

    /**
     * Get LINE as dxf entity section string
     * 
     * @param {Number} x1 coordinate `x` of first point
     * @param {Number} y1 coordinate `y` of first point
     * @param {Number} z1 coordinate `z` of first point
     * @param {Number} x2 coordinate `x` of second point
     * @param {Number} y2 coordinate `y` of second point
     * @param {Number} z2 coordinate `z` of second point
     * @param {String} layer the name of the layer to place the object
     * @returns {String} entity as dxf string
     */
    static getDxfLine(x1, y1, z1, x2, y2, z2, layer='default_layer') {
        if (isNaN(Number(x1)) || isNaN(Number(y1)) || isNaN(Number(z1)) || isNaN(Number(x2)) || isNaN(Number(y2)) || isNaN(Number(z2))) {
            throw new Error('Wrong data format');
        }
        let entity = '';
        entity += '0\n';
        entity += 'LINE\n';
        entity += '8\n';
        entity += layer + '\n';
        entity += '10\n';
        entity += x1 + '\n';
        entity += '20\n';
        entity += y1 + '\n';
        entity += '30\n';
        entity += z1 + '\n';
        entity += '11\n';
        entity += x2 + '\n';
        entity += '21\n';
        entity += y2 + '\n';
        entity += '31\n';
        entity += z2 + '\n';
        return entity;
    }

    /**
     * Get ARC as dxf entity section string
     * 
     * @param {Number} x coordinate `x` of center of the arc
     * @param {Number} y coordinate `y` of center of the arc
     * @param {Number} z coordinate `z` of center of the arc
     * @param {Number} R radius of the arc
     * @param {Number} fi_start start angle of the arc
     * @param {Number} fi_end end angle of the arc
     * @param {String} layer the name of the layer to place the object
     * @returns {String} entity as dxf string
     */
    static getDxfArc(x, y, z, R, fi_start, fi_end, layer='default_layer') {
        if (isNaN(Number(x)) || isNaN(Number(y)) || isNaN(Number(z)) || isNaN(Number(R)) || isNaN(Number(fi_start)) || isNaN(Number(fi_end))) {
            throw new Error('Wrong data format');
        }
        let entity = '';
        entity += '0\n';
        entity += 'ARC\n';
        entity += '8\n';
        entity += layer + '\n';
        entity += '10\n';
        entity += x + '\n';
        entity += '20\n';
        entity += y + '\n';
        entity += '30\n';
        entity += z + '\n';
        entity += '40\n';
        entity += R + '\n';
        entity += '50\n';
        entity += fi_start + '\n';
        entity += '51\n';
        entity += fi_end + '\n';
        return entity;
    }

    /**
     * Get CIRCLE as dxf entity section string
     * 
     * @param {Number} x coordinate `x` of center of the circle
     * @param {Number} y coordinate `y` of center of the circle
     * @param {Number} z coordinate `z` of center of the circle
     * @param {Number} R radius of the circle
     * @param {String} layer the name of the layer to place the object
     * @returns {String} entity as dxf string
     */
    static getDxfCircle(x, y, z, R, layer='default_layer') {
        if (isNaN(Number(x)) || isNaN(Number(y)) || isNaN(Number(z)) || isNaN(Number(R))) {
            throw new Error('Wrong data format');
        }
        let entity = '';
        entity += '0\n';
        entity += 'CIRCLE\n';
        entity += '8\n';
        entity += layer + '\n';
        entity += '10\n';
        entity += x + '\n';
        entity += '20\n';
        entity += y + '\n';
        entity += '30\n';
        entity += z + '\n';
        entity += '40\n';
        entity += R + '\n';
        return entity;
    }
}

/*
 * Header strings for DXF file.
 * @type {string[]}
 */
const headerSection = [
    '0',
    'SECTION',
    '2',
    'HEADER',
    '9',
    '$ACADVER',
    '1',
    'AC1009',
    '9',
    '$INSUNITS',
    '70',
    '4',
    '9',
    '$AUNITS',
    '70',
    '0',
    '9',
    '$AUPREC',
    '70',
    '2',
    '0',
    'ENDSEC',
];
const tablesSectionStart = [
    '0',
    'SECTION',
    '2',
    'TABLES',
];
const vportTable_Part1 = [
    '0',
    'TABLE',
    '2',
    'VPORT',
    '70',
    '1',
    '0',
    'VPORT',
    '2',
    '*ACTIVE',
    '70',
    '0',
    '10',
    '0.0',
    '20',
    '0.0',
    '11',
    '1.0',
    '21',
    '1.0',
    '12',
    '0.0',
    '22',
    '0.0',
    '13',
    '0.0',
    '23',
    '0.0',
    '14',
    '10.0',
    '24',
    '10.0',
    '15',
    '5.0',
    '25',
    '5.0',
    '16',
    '0.0',
    '26',
    '0.0',
    '36',
    '1.0',
    '17',
    '0.0',
    '27',
    '0.0',
    '37',
    '0.0',
    '40',
];
const vportTable_Part2 = [
    '41',
    '2.5',
    '42',
    '50.0',
    '43',
    '0.0',
    '44',
    '0.0',
    '50',
    '0.0',
    '51',
    '0.0',
    '71',
    '0',
    '72',
    '1000',
    '73',
    '1',
    '74',
    '3',
    '75',
    '0',
    '76',
    '1',
    '77',
    '0',
    '78',
    '0',
    '0',
    'ENDTAB',
];
const linesTable = [
    '0',
    'TABLE',
    '2',
    'LTYPE',
    '70',
    '3', // lines_count+1 
    //  CONTINUOUS line description
    '0',
    'LTYPE',
    '2',
    'CONTINUOUS',
    '70',
    '0',
    '3',
    'Solid line',
    '72',
    '65',
    '73',
    '0',
    '40',
    '0.0',
    //  LONG_DASHED_DOTTED line description
    '0',
    'LTYPE',
    '2',
    'LONG_DASHED_DOTTED',
    '70',
    '0',
    '3',
    'Long dashed dotted __ . __ . __ . __ . __ . __ . _',
    '72',
    '65',
    '73',
    '4', // elements count
    '40',
    '10.0', // total length
    '49',
    '7.0', //  dash length
    '49',
    '-1.0', //  before dot length
    '49',
    '1.0', //  dot(line) length
    '49',
    '-1.0', //  after dot length
    //  lines description end
    '0',
    'ENDTAB',   
];
const tablesSectionEnd = [
    '0',
    'ENDSEC',
];
const entitiesSectionStart = [
    '0',
    'SECTION',
    '2',
    'ENTITIES'
];