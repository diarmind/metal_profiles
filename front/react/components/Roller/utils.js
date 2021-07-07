import {VectorShared} from "../../shared/formats.js";
import {ArcDirections, LineShared, SharedFormats} from "../../shared/formats";
import * as THREE from "three";

/**
 * Get intermediate line between 2 lines.
 * @param {VectorShared[]} fromVectors - vectors represent first line.
 * @param {VectorShared[]} toVectors - vectors represent second line.
 * @param {Number} position - position between first and second line in fractions of 1.
 * @returns {VectorShared[]}
 */
const getIntermediateVectors = (fromVectors, toVectors, position) => {
    return fromVectors.map((_, i) => {
        return new VectorShared({
            x: fromVectors[i].x + (toVectors[i].x - fromVectors[i].x) * position,
            y: fromVectors[i].y + (toVectors[i].y - fromVectors[i].y) * position,
            z: fromVectors[i].z + (toVectors[i].z - fromVectors[i].z) * position,
        });
    });
};


/**
 * Create new VectorShared with Z from another one VectorShared
 * @param {Number} z
 * @param {VectorShared} vector
 */
const createWithZ = (z, vector) => {
    return new VectorShared({
        x: vector.x,
        y: vector.y,
        z: z,
    });
};


/**
 * Create lines from arc, nothing do for lines.
 * @param {LineShared|ArcShared} primitive - target.
 * @param {Number} approximateCount - how much lines will arc be approximate with.
 * @return {LineShared[] | *}
 */
const arcToLines = (primitive, approximateCount) => {
    if (primitive.type === SharedFormats.ARC) {
        const arc = new THREE.EllipseCurve(
            primitive.x,
            primitive.y,
            primitive.R,
            primitive.R,
            primitive.fi_start,
            primitive.fi_end,
            primitive.direction === ArcDirections.CLOCKWISE,
            0,
        );

        const points = arc.getPoints(approximateCount);

        let result = [];
        const pointsToVectors = (_, i, all) => {
            if (i === 0) {
                return;
            }
            result.push(LineShared.fromVectors(
                new VectorShared({
                    x: all[i - 1].x,
                    y: all[i - 1].y,
                    z: 0,
                }),
                new VectorShared({
                    x: all[i].x,
                    y: all[i].y,
                    z: 0,
                }),
            ));
        };
        points.forEach(pointsToVectors);
        return result;
    }
    console.warn(`Unexpected type: ${primitive.type}, expected ${SharedFormats.ARC}`);
    return primitive;
};


/**
 * Create multiple lines from line, nothing do for arcs.
 * @param {ArcShared|LineShared} primitive
 * @param {Number} approximateCount - lines count
 * @return {LineShared[] | *}
 */
const lineToLines = (primitive, approximateCount) => {
    if (primitive.type === SharedFormats.LINE) {
        const [vec1, vec2] = primitive.getVectors();
        let result = [];
        for (let i = 1; i <= approximateCount; i++) {
            const fromMult = (i - 1) / approximateCount;
            const toMult = i / approximateCount;
            result.push(LineShared.fromVectors(
                new VectorShared({
                    x: vec1.x + (vec2.x - vec1.x) * fromMult,
                    y: vec1.y + (vec2.y - vec1.y) * fromMult,
                    z: vec1.z + (vec2.z - vec1.z) * fromMult,
                }),
                new VectorShared({
                    x: vec1.x + (vec2.x - vec1.x) * toMult,
                    y: vec1.y + (vec2.y - vec1.y) * toMult,
                    z: vec1.z + (vec2.z - vec1.z) * toMult,
                }),
            ))
        }
        return result;
    }
    console.warn(`Unexpected type: ${primitive.type}, expected: ${SharedFormats.LINE}`);
    return primitive;
};


let dispose = function(o) {
    try {
        if (o && typeof o === 'object') {
            if (Array.isArray(o)) {
                o.forEach(dispose);
            } else
            if (o instanceof THREE.Object3D) {
                dispose(o.geometry);
                dispose(o.material);
                dispose(o.children);
            } else
            if (o instanceof THREE.Geometry) {
                o.dispose();
            } else
            if (o instanceof THREE.Material) {
                o.dispose();
                dispose(o.materials);
                dispose(o.map);
                dispose(o.lightMap);
                dispose(o.bumpMap);
                dispose(o.normalMap);
                dispose(o.specularMap);
                dispose(o.envMap);
            } else
            if (typeof o.dispose === 'function') {
                o.dispose();
            } else {
                Object.values(o).forEach(dispose);
            }
        }
    } catch (error) {
        console.warn(error);
    }
};

export {getIntermediateVectors, createWithZ, arcToLines, lineToLines, dispose};
