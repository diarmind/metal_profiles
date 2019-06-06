import Primitive from './primitive';
import Dxf from './dxf';

/**
 * DxfCoverter class
 */
export default class DxfConverter {
    /**
     * Write array of curves to dxfFile writeLARtoDxf()
     * @throws Will throw error from writeLARtoDxf
     * @param {Array} curves    is array: `[curve = {L: [{Number}], A: [{Number}], R: [{Number}], SP, X, Y, Z, Alpha, layerName}]`,
     *  where `SP` is Start Point
     * @param {Dxf} dxfFile     dxfFile to save
     */
    writeLARsToDxf(curves, dxfFile) {
        for(let curve of curves) {
            try {
                this.writeLARtoDxf(curve, dxfFile);
            } catch (err) {
                throw err;
            }
        }
    }

    /**
     * Write curve to dxfFile
     * @throws {Error} Will throw error if params in curve not valid
     * @param {Object} curve    curve is `{L: [{Number}], A: [{Number}], R: [{Number}], SP, X, Y, Z, Alpha, layerName}`,
     *  where `SP` is Start Point
     * @param {Dxf} dxfFile     dxfFile to save 
     */
    writeLARtoDxf(curve, dxfFile) {
        let primitives;
        try {
            primitives = this.convertLARtoPrimitives(curve);
        } catch (err) {
            throw err;
        }
        this.writePrimitivesToDxf(primitives, dxfFile, curve.layerName);
    }

    /**
     * Write sections to dxfFile
     * @param {Array} sections array of sections
     * @param {Dxf} dxfFile dxfFile to save
     */
    writeSectionsToDxf(sectionsData, dxfFile) {
        for(const [key, section] of sectionsData.sections.entries()) {
            try {
                this.writeSectionToDxf(section, dxfFile, key+1,
                    sectionsData.colors, sectionsData.lineTypes, sectionsData.layerNames);
            } catch (err) {
                throw err;
            }
        }
    }

    /**
     * Write section to dxfFile
     * @param {Object} section section with neutralLine, profile and rollers
     * @param {Dxf} dxfFile dxfFile to save 
     * @param {String} layerName name of layer where section will be placed
     */
    writeSectionToDxf(section, dxfFile, sectionNumber, colors, lineTypes, layerNames) {
        if (section.neutralPolyline && Array.isArray(section.neutralPolyline.primitives)) {
            let layerName = `S${sectionNumber}_neutral_line`;
            if (layerNames && layerNames.neutral) {
                layerName = `S${sectionNumber}_${layerNames.neutral}`;
            }

            let layerColor;
            if (colors && colors.neutral) {
                layerColor = this._getDxfColor(colors.neutral);
            } else {
                layerColor = Dxf.colors.YELLOW;
            }

            let lineType;
            if (lineTypes && lineTypes.neutral) {
                lineType = this._getDxfLineTypes(lineTypes.neutral);
            } else {
                lineType = Dxf.lineTypes.LONG_DASHED_DOTTED;
            }

            dxfFile.addLayer(
                {
                    layerName,
                    layerColor,
                    lineType,
                }
            );
            this._convertAndWritePrimitives(section.neutralPolyline.primitives, dxfFile, layerName);
        }

        if (section.profileSections && Array.isArray(section.profileSections.primitives)) {
            let layerName = `S${sectionNumber}_equidistants`;
            if (layerNames && layerNames.profile) {
                layerName = `S${sectionNumber}_${layerNames.profile}`;
            }

            let layerColor;
            if (colors && colors.profile) {
                layerColor = this._getDxfColor(colors.profile);
            } else {
                layerColor = Dxf.colors.RED;
            }

            let lineType;
            if (lineTypes && lineTypes.profile) {
                lineType = this._getDxfLineTypes(lineTypes.profile);
            } else {
                lineType = Dxf.lineTypes.CONTINUOUS;
            }

            dxfFile.addLayer(
                {
                    layerName,
                    layerColor,
                    lineType,
                }
            );
            this._convertAndWritePrimitives(section.profileSections.primitives, dxfFile, layerName);
        }

        if (section.rollers && Array.isArray(section.rollers)) {
            for (const [rNumber, roller] of section.rollers.entries()) {
                if (Array.isArray(roller.primitives)) {
                    let rollerGeometry = roller.primitives;
                    let axis;
                    if (roller.axisId) {
                        rollerGeometry = roller.primitives.filter(primitive => primitive.id !== roller.axisId);
                        axis = roller.primitives.filter(primitive => primitive.id === roller.axisId);
                    }

                    let layerName = `S${sectionNumber}_roller_${rNumber}`;
                    if (layerNames && layerNames.roller) {
                        layerName = `S${sectionNumber}_${layerNames.roller}_${rNumber}`;
                    }

                    let layerColor;
                    if (colors && colors.roller) {
                        layerColor = this._getDxfColor(colors.roller);
                    } else {
                        layerColor = Dxf.colors.BLUE;
                    }
                    
                    let lineType;
                    if (lineTypes && lineTypes.roller) {
                        lineType = this._getDxfLineTypes(lineTypes.roller);
                    } else {
                        lineType = Dxf.lineTypes.CONTINUOUS;
                    }

                    dxfFile.addLayer(
                        {
                            layerName,
                            layerColor,
                            lineType,
                        }
                    );
                    this._convertAndWritePrimitives(rollerGeometry, dxfFile, layerName);
                    
                    layerName = `S${sectionNumber}_roller_axis_${rNumber}`;
                    if (layerNames && layerNames.rollerAxis) {
                        layerName = `S${sectionNumber}_${layerNames.rollerAxis}_${rNumber}`;
                    }
                    
                    if (colors && colors.rollerAxis) {
                        layerColor = this._getDxfColor(colors.rollerAxis);
                    } else {
                        layerColor = Dxf.colors.GRAY;
                    }
                    
                    if (lineTypes && lineTypes.rollerAxis) {
                        lineType = this._getDxfLineTypes(lineTypes.rollerAxis);
                    } else {
                        lineType = Dxf.lineTypes.LONG_DASHED_DOTTED;
                    }

                    dxfFile.addLayer(
                        {
                            layerName,
                            layerColor,
                            lineType,
                        }
                    );
                    this._convertAndWritePrimitives(axis, dxfFile, layerName);
                }
            }
        }

    }

    _getDxfColor(color) {
        switch (color) {
            case 1:
                return Dxf.colors.RED;
            case 2:
                return Dxf.colors.YELLOW;
            case 3:
                return Dxf.colors.GREEN;
            case 4:
                return Dxf.colors.CYAN;
            case 5:
                return Dxf.colors.BLUE;
            case 6:
                return Dxf.colors.MAGENTA;
            case 7:
                return Dxf.colors.WHITE;
            case 8:
                return Dxf.colors.GRAY;
            case 9:
                return Dxf.colors.GREY;
    
            default:
                return Dxf.colors.WHITE;
        }
    }

    _getDxfLineTypes(type) {
        switch (type) {
            case 1:
                return Dxf.lineTypes.CONTINUOUS;
            case 2:
                return Dxf.lineTypes.LONG_DASHED_DOTTED;
        }
    }

    _convertAndWritePrimitives(primitives, dxfFile, layerName) {
        let primitivesLocal;
        try {
            primitivesLocal = this.convertCommonPrimitivesToPrimitives(primitives);
        } catch (err) {
            throw err;
        }
        this.writePrimitivesToDxf(primitivesLocal, dxfFile, layerName);
    }

    /**
     * Convert section.primitives to array of `Primitives`
     * @param {*} section 
     * @returns {Array<Primitive>} primitives array
     */
    convertCommonPrimitivesToPrimitives(primitivesCommon) {
        const primitives = [];
        for (const primitive of primitivesCommon) {
            switch (primitive.type.toUpperCase()) {
                case Primitive.types.LINE:
                    primitives.push(new Primitive({
                        x1: primitive.x1,
                        y1: primitive.y1,
                        z1: primitive.z1,
                        x2: primitive.x2,
                        y2: primitive.y2,
                        z2: primitive.z2,
                    }, Primitive.types.LINE));
                    break;
                case Primitive.types.ARC:
                    primitives.push(new Primitive({
                        x: primitive.x,
                        y: primitive.y,
                        z: primitive.z,
                        R: primitive.R,
                        fi1: primitive.fi_start,
                        fi2: primitive.fi_end,
                    }, Primitive.types.ARC));
                    break;
            }
        }
        return primitives;
    }

    /**
     * Convert curve presented by LAR vectors to array of `Primitive`
     * @throws {Error} Will throw error if params in curve not valid
     * @param {Object} curve curve is `{L: [{Number}], A: [{Number}], R: [{Number}], SP, X, Y, Z, Alpha, layerName}`,
     *  where `SP` is Start Point
     * @returns {Array<Primitive>} primitives array
     */
    convertLARtoPrimitives(curve) {
        const primitives = [];

        if (curve.L.length != curve.A.length || curve.L.length != curve.R.length) {
            throw new Error('LAR vectors are not the same size');
        }

        const count = curve.L.length;
        if (curve.SP < 0 || curve.SP > count) {
            throw new Error('SP not valid: ' + curve.SP);
        }

        let leftDirection = 180.0;
        let rightDirection = 0.0;

        let midElement = Math.floor(curve.SP);
        if(midElement == count) {
            midElement--;
        }

        let curentLeftX = 0.0;
        let curentLeftY = 0.0;
        let curentRightX = 0.0;
        let curentRightY = 0.0;

        if (curve.R[midElement] == 0) {  // it's LINE
            let leftPart = curve.SP - Math.floor(curve.SP);
            let rightPart = Math.ceil(curve.SP) - curve.SP;
            if (curve.SP == Math.ceil(curve.SP)) {
                rightPart = 1.0;
            }
            curentLeftX = -1 * curve.L[midElement] * leftPart;
            curentRightX = curve.L[midElement] * rightPart;

            let coordinates = {
                x1: curentLeftX,
                y1: 0,
                z1: curve.Z,
                x2: curentRightX,
                y2: 0,
                z2: curve.Z
            };
            primitives[midElement] = new Primitive(coordinates, Primitive.types.LINE);
        } else { //  it's ARC
            let leftAnglePart = curve.SP - Math.floor(curve.SP);
            let rightAnglePart = Math.ceil(curve.SP) - curve.SP;
            let leftAngle = curve.A[midElement] * leftAnglePart;
            let rightAngle = curve.A[midElement] * rightAnglePart;
            if (curve.SP == count) {
                leftAngle = curve.A[midElement];
            } else if(curve.SP == Math.floor(curve.SP)) {
                rightAngle = curve.A[midElement];
            }

            let centerCoordinates;
            if (Math.sign(curve.A[midElement]) > 0) {
                centerCoordinates = this._arcCenterByClockwiseTangent(curentLeftX, curentLeftY, curve.R[midElement], leftDirection);
            } else {
                centerCoordinates = this._arcCenterByCounterClockwiseTangent(curentLeftX, curentLeftY, curve.R[midElement], leftDirection);
            }

            let localCurentLeftX = curentLeftX - centerCoordinates.x;
            let localCurentLeftY = curentLeftY - centerCoordinates.y;
            let newLocalLeftCoords = this._rotateVector(localCurentLeftX, localCurentLeftY, -1 * leftAngle);
            curentLeftX = newLocalLeftCoords.x + centerCoordinates.x;
            curentLeftY = newLocalLeftCoords.y + centerCoordinates.y;

            let localCurentRightX = curentRightX - centerCoordinates.x;
            let localCurentRightY = curentRightY - centerCoordinates.y;
            let newLocalRightCoords = this._rotateVector(localCurentRightX, localCurentRightY, rightAngle);
            curentRightX = newLocalRightCoords.x + centerCoordinates.x;
            curentRightY = newLocalRightCoords.y + centerCoordinates.y;

            let baseAngle;
            if (Math.sign(curve.A[midElement]) > 0) {
                baseAngle = leftDirection + 90;
            } else {
                baseAngle = leftDirection - 90;
            }

            let startAngle;
            let endAngle;
            if (Math.sign(curve.A[midElement]) > 0) {
                startAngle = baseAngle - leftAngle;
                endAngle = baseAngle + rightAngle;
            } else {
                startAngle = baseAngle + rightAngle;
                endAngle = baseAngle - leftAngle;
            }

            leftDirection -= leftAngle;
            rightDirection += rightAngle;

            let coordinates = {
                x: centerCoordinates.x,
                y: centerCoordinates.y,
                z: curve.Z,
                R: curve.R[midElement],
                fi1: startAngle,
                fi2: endAngle
            };
            primitives[midElement] = new Primitive(coordinates, Primitive.types.ARC);
        }

        let curentElement; // index of curent element

        //  left round
        curentElement = midElement - 1;
        while (curentElement >= 0) {
            if (curve.R[curentElement] == 0) {  // it's LINE
                let leftLength = curve.L[curentElement];
                let leftSegment = this._rotateVector(leftLength, 0, leftDirection);

                let newLeftX = leftSegment.x + curentLeftX;
                let newLeftY = leftSegment.y + curentLeftY;

                let coordinates = {
                    x1: newLeftX,
                    y1: newLeftY,
                    z1: curve.Z,
                    x2: curentLeftX,
                    y2: curentLeftY,
                    z2: curve.Z
                };
                curentLeftX = newLeftX;
                curentLeftY = newLeftY;

                primitives[curentElement] = new Primitive(coordinates, Primitive.types.LINE);
            } else { //  it's ARC
                let angle = curve.A[curentElement];
                let centerCoordinates;
                if (Math.sign(angle) > 0) {
                    centerCoordinates = this._arcCenterByClockwiseTangent(curentLeftX, 
                        curentLeftY, curve.R[curentElement], leftDirection);
                } else {
                    centerCoordinates = this._arcCenterByCounterClockwiseTangent(curentLeftX, 
                        curentLeftY, curve.R[curentElement], leftDirection);
                }

                let localCurentLeftX = curentLeftX - centerCoordinates.x;
                let localCurentLeftY = curentLeftY - centerCoordinates.y;
                let newLocalLeftCoords = this._rotateVector(localCurentLeftX, localCurentLeftY, -1 * angle);
                curentLeftX = newLocalLeftCoords.x + centerCoordinates.x;
                curentLeftY = newLocalLeftCoords.y + centerCoordinates.y;

                let baseAngle;
                let startAngle;
                let endAngle;
                if (Math.sign(angle) > 0) {
                    baseAngle = leftDirection + 90;
                    startAngle = baseAngle - angle;
                    endAngle = baseAngle;
                } else {
                    baseAngle = leftDirection - 90;
                    startAngle = baseAngle;
                    endAngle = baseAngle - angle;
                }

                leftDirection -= angle;

                let coordinates = {
                    x: centerCoordinates.x,
                    y: centerCoordinates.y,
                    z: curve.Z,
                    R: curve.R[curentElement],
                    fi1: startAngle,
                    fi2: endAngle
                };
                primitives[curentElement] = new Primitive(coordinates, Primitive.types.ARC);
            }

            curentElement--;
        }

        //  right round
        curentElement = midElement + 1;
        while (curentElement < count) {
            if (curve.R[curentElement] == 0) {  // it's LINE
                let rightLength = curve.L[curentElement];
                let rightSegment = this._rotateVector(rightLength, 0, rightDirection);

                let newRightX = rightSegment.x + curentRightX;
                let newRightY = rightSegment.y + curentRightY;

                let coordinates = {
                    x1: curentRightX,
                    y1: curentRightY,
                    z1: curve.Z,
                    x2: newRightX,
                    y2: newRightY,
                    z2: curve.Z
                };
                curentRightX = newRightX;
                curentRightY = newRightY;

                primitives[curentElement] = new Primitive(coordinates, Primitive.types.LINE);
            } else { //  it's ARC
                let angle = curve.A[curentElement];
                let centerCoordinates;
                if (Math.sign(angle) > 0) {
                    centerCoordinates = this._arcCenterByCounterClockwiseTangent(curentRightX, 
                        curentRightY, curve.R[curentElement], rightDirection);
                } else {
                    centerCoordinates = this._arcCenterByClockwiseTangent(curentRightX, 
                        curentRightY, curve.R[curentElement], rightDirection);
                }

                let localCurentRightX = curentRightX - centerCoordinates.x;
                let localCurentRightY = curentRightY - centerCoordinates.y;
                let newLocalRightCoords = this._rotateVector(localCurentRightX, localCurentRightY, angle);
                curentRightX = newLocalRightCoords.x + centerCoordinates.x;
                curentRightY = newLocalRightCoords.y + centerCoordinates.y;

                let baseAngle;
                let startAngle;
                let endAngle;
                if (Math.sign(angle) > 0) {
                    baseAngle =  rightDirection - 90;
                    startAngle = baseAngle;
                    endAngle = baseAngle + angle;
                } else {
                    baseAngle =  rightDirection + 90;
                    startAngle = baseAngle + angle;
                    endAngle = baseAngle;
                }

                rightDirection += angle;

                let coordinates = {
                    x: centerCoordinates.x,
                    y: centerCoordinates.y,
                    z: curve.Z,
                    R: curve.R[curentElement],
                    fi1: startAngle,
                    fi2: endAngle
                };
                primitives[curentElement] = new Primitive(coordinates, Primitive.types.ARC);
            }

            curentElement++;
        }

        this._rotatePrimitives(primitives, curve.Alpha);
        this._movePrimiteives(primitives, curve.X, curve.Y);

        return primitives;
    }

    /**
     * @private
     * @param {Array<Primitive>} primitives 
     * @param {Number} X 
     * @param {Number} Y 
     */
    _movePrimiteives(primitives, X, Y) {
        for (let i = 0; i < primitives.length; i++) {
            if (primitives[i] != null) {
                if (primitives[i].type == Primitive.types.LINE) {
                    primitives[i].x1 += X;
                    primitives[i].y1 += Y;
                    primitives[i].x2 += X;
                    primitives[i].y2 += Y;
                }
                if (primitives[i].type == Primitive.types.ARC) {
                    primitives[i].x += X;
                    primitives[i].y += Y;
                }
            }
        }
    }

    /**
     * @private
     * @param {Array<Primitive>} primitives 
     * @param {Number} Alpha angle
     */
    _rotatePrimitives(primitives, Alpha) {
        if (Math.abs(Alpha) < 1e-6) {
            return;
        }
        for (let i = 0; i < primitives.length; i++) {
            if (primitives[i] != null) {
                if (primitives[i].type == Primitive.types.LINE) {
                    const newP1 = this._rotateVector(primitives[i].x1, primitives[i].y1, Alpha);
                    primitives[i].x1 = newP1.x;
                    primitives[i].y1 = newP1.y;
                    const newP2 = this._rotateVector(primitives[i].x2, primitives[i].y2, Alpha);
                    primitives[i].x2 = newP2.x;
                    primitives[i].y2 = newP2.y;
                }
                if (primitives[i].type == Primitive.types.ARC) {
                    const newCenter = this._rotateVector(primitives[i].x, primitives[i].y, Alpha);
                    primitives[i].x = newCenter.x;
                    primitives[i].y = newCenter.y;
                    primitives[i].fi1 += Alpha;
                    primitives[i].fi2 += Alpha;
                }
            }
        }
    }

    /**
     * Write array of primitives to dfx file 
     * @param {Array<Primitive>} primitives 
     * @param {Dxf} dxfFile dxf file object to write
     * @param {String} layerName
     */
    writePrimitivesToDxf(primitives, dxfFile, layerName) {
        for (const primitive of primitives) {
            if (primitive) {
                switch (primitive.type.toUpperCase()) {
                    case Primitive.types.LINE:
                        dxfFile.addDxfLine(primitive.x1, primitive.y1, primitive.z1, 
                            primitive.x2, primitive.y2, primitive.z2, layerName);
                        break;
                    case Primitive.types.ARC:
                        if (primitive.fi2 - primitive.fi1 !== 0)
                            dxfFile.addDxfArc(primitive.x, primitive.y, primitive.z, 
                                primitive.R, primitive.fi1, primitive.fi2, layerName);
                        break;
                    default:
                        break;
                }
            }
        }
    }

    /**
     * Rotate vector (0; 0), (x; y)
     * 
     * @private
     * @param {Number} x `X` coordinate of second point
     * @param {Number} y `Y` coordinate of second point
     * @param {Number} alfa angle in degree
     * @returns {Object} object with new `x` and `y` coordinate
     */
    _rotateVector(x, y, alfa) {
        if (Math.abs(alfa) < 1e-6) {
            return {x, y};
        }
        let alfaInRad = alfa * Math.PI / 180;
        let x_ = x * Math.cos(alfaInRad) - y * Math.sin(alfaInRad);
        let y_ = x * Math.sin(alfaInRad) + y * Math.cos(alfaInRad);
        return {x: x_, y: y_};
    }

    /**
     * @private
     * @returns {Object} coordinates of center of the arc
     */
    _arcCenterByClockwiseTangent(x, y, R, tangentAngle) {
        let centerAngle = tangentAngle - 90;
        
        let localCSCenter = this._rotateVector(R, 0, centerAngle);
        let centerX = localCSCenter.x + x;
        let centerY = localCSCenter.y + y;

        return {x: centerX, y:centerY};
    }

    /**
     * @private
     * @returns {Object} coordinates of center of the arc
     */
    _arcCenterByCounterClockwiseTangent (x, y, R, tangentAngle) {
        let centerAngle = tangentAngle + 90;
        
        let localCSCenter = this._rotateVector(R, 0, centerAngle);
        let centerX = localCSCenter.x + x;
        let centerY = localCSCenter.y + y;

        return {x: centerX, y:centerY};
    }
}