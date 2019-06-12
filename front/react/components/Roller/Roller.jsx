import React from 'react';
import * as THREE from "three";
import * as OrbitControls from 'three-orbitcontrols';

import Controller from './components/Controller/Controller.jsx';
import {ArcDirections, ArcShared, CurveShared, LineShared, SharedFormats, VectorShared} from "../../shared/formats.js";
import {arcToLines, createWithZ, getIntermediateVectors, lineToLines, dispose} from './utils.js';
// mock
import {FigureTypes, ProfileFigure, RollerFigure} from '../../shared/figures.js';


export default class Roller extends React.Component {
    constructor(props) {
        super(props);

        this.mount = React.createRef();

        this.scene = null;
        this.camera = null;
        this.renderer = null;

        this.profileLineMeshSections = [];
        this.rollerMeshes = [];
        this.rollerGroupMeshes = [];
        this.plugs = null;

        this.isStop = true;
        this.isPaused = false;
        this.forceAnimationRerender = false;
        this.currentAnimationPosition = 0; // changes from 0 to 1
        this.showProfileAnimationLength = 15;
        this.tempAnimationProfileMesh = null;

        // user-editable parameters
        // simple
        this.zDiff = 20;
        // advanced
        this.arcApproximationCount = 4;
        this.lineApproximationCount = 5;
        this.additionalRenderingStages = 20;
    }

    /**
     * Function initializes scene
     */
    initScene = () => {
        // ADD SCENE
        const width = this.mount.current.clientWidth;
        const height = this.mount.current.clientHeight;
        this.scene = new THREE.Scene();

        // ADD CAMERA
        this.camera = new THREE.PerspectiveCamera(
            90,
            width / height,
            0.1,
            2000
        );
        this.camera.position.z = 4;

        // CAMERA CONTROLS
        new OrbitControls(this.camera, this.mount.current);

        //ADD RENDERER
        this.renderer = new THREE.WebGLRenderer({antialias: true});
        this.renderer.setClearColor('#ffffff');
        this.renderer.setSize(width, height);

        // APPEND TO DOM
        this.mount.current.appendChild(this.renderer.domElement);
    };

    /**
     * Function initializes helpers
     */
    initHelpers = () => {
        // AXES HELPER
        const axesHelper = new THREE.AxesHelper(3);
        this.scene.add(axesHelper);

        // GRID HELPER
        const gridSize = 100;
        const gridDivisions = 100;
        const gridHelper = new THREE.GridHelper(gridSize, gridDivisions);
        this.scene.add(gridHelper);
    };

    /**
     * Function initializes profiles after previous technological step
     */
    init() {
        this.profiles = null;
        this.rollers = null;

        let {dataIn} = this.props;
        dataIn = createMockPrimitives();

        const reduceByTypes = ((prev, stage, i) => {
            stage.forEach((figure) => {
                const type = figure.type;
                prev[type] = prev[type] || [];
                prev[type][i] = prev[type][i] || [];
                prev[type][i].push(figure);
            });
            return prev;
        });
        let reorderedStages = dataIn.reduce(reduceByTypes, {});
        this.profiles = (reorderedStages[FigureTypes.PROFILE] || []).flat();
        this.rollers = (reorderedStages[FigureTypes.ROLLER] || []).map((rollerStage) => {
            return rollerStage.flat();
        });
        this.addExtremeStages();
        this.renderAll();
        this.startAnimation();
    }

    renderAll() {
        this.renderProfileSurface({sections: this.additionalRenderingStages, zDiff: this.zDiff});
        this.renderRollers({zDiff: this.zDiff});
    }

    componentDidMount() {
        this.initScene();
        this.initHelpers();
        this.init();
        this.renderScene();

        window.addEventListener('resize', this.fitSize);
    }

    componentWillUnmount(){
        window.removeEventListener('resize', this.fitSize);

        this.stopAnimation();
        this.mount.current.removeChild(this.renderer.domElement);
    }

    /**
     * Add stages for start and end of profiles.
     */
    addExtremeStages() {
        if (this.profiles && this.profiles.length) {
            this.profiles.push(this.profiles[this.profiles.length - 1]);
            this.profiles.unshift(this.profiles[0]);

            if (this.rollers && this.rollers.length) {
                this.rollers.push([]);
                this.rollers.unshift([]);
            }
        }
    }

    /**
     * Analyzes profiles for arcs and matches number of primitive.
     * Defined arcs writes to this.arcs.
     */
    defineArcs() {
        const arcs = [];
        this.profiles.forEach((profile) => {
            const primitives = profile.curve.primitives;
            primitives.forEach((primitive, i) => {
                if (primitive.type === SharedFormats.ARC) {
                    arcs.push(i);
                }
            });
        });
        this.arcs = Array.from(new Set(arcs));
    }

    /**
     * All arcs and associated lines will be approximated by lines for 3D visualizing.
     * @param {LineShared | ArcShared} primitive
     * @param {Number} approximateCount - lines count.
     */
    processArc(primitive, approximateCount) {
        if (primitive.type === SharedFormats.ARC) {
            primitive = arcToLines(primitive, approximateCount);
        } else if (primitive.type === SharedFormats.LINE) {
            primitive = lineToLines(primitive, approximateCount);
        }
        return primitive;
    }

    /**
     * Preprocess profile primitives: approximate ArcShared with LineShared, split simple LineShared.
     * @param {(ArcShared | LineShared)[]} primitives - figure primitives.
     * @param {Number} arcApproximateCount - number of lines one arc approximate with.
     * @param {Number} simpleLineApproximateCount - number of lines one line approximates with.
     * @return {LineShared[]}
     */
    preprocessProfilePrimitives(primitives, arcApproximateCount, simpleLineApproximateCount) {
        const result = primitives.map((primitive, i) => {
            if (this.arcs.includes(i)) {
                return this.processArc(primitive, arcApproximateCount);
            }
            return lineToLines(primitive, simpleLineApproximateCount);
        });
        return result.flat();
    }

    /**
     * Preprocess roller primitives: approximate ArcShared with LineShared, split simple LineShared.
     * @param {(ArcShared | LineShared)[]} primitives
     * @param {Number} arcApproximateCount
     * @param {Number} simpleLineApproximateCount
     */
    preprocessRollerPrimitives(primitives, arcApproximateCount, simpleLineApproximateCount) {
        const result = primitives.map((primitive) => {
            if (primitive.type === SharedFormats.ARC) {
                return arcToLines(primitive, arcApproximateCount);
            }
            if (primitive.type === SharedFormats.LINE) {
                return lineToLines(primitive, simpleLineApproximateCount);
            }
            console.warn('Unknown type of primitive: ', primitive);
            return primitive;
        });
        return result.flat();
    }

    /**
     * Function renders profile in 3D.
     * @param {Object} obj
     * @param {Number} obj.zDiff - z diff between profiles.
     * @param {Number} obj.sections - intermediate profile figures count between 2 profile figures.
     */
    renderProfileSurface = ({zDiff, sections}) => {
        // clean scene when rerender
        this.profileLineMeshSections.forEach((section) => {
            dispose(section);
            this.scene.remove(section);
        });
        this.profileLineMeshSections = [];
        if (this.plugs) {
            dispose(this.plugs);
            this.scene.remove(this.plugs);
            this.plugs = null;
        }

        this.defineArcs();
        const profileMaterial = new THREE.MeshBasicMaterial({
            color: '#433F81',
            polygonOffset: true,
            polygonOffsetFactor: 1, // positive value pushes polygon further away
            polygonOffsetUnits: 1,
        });
        const lineMaterial = new THREE.LineBasicMaterial({color: 0xffffff, linewidth: 2});
        const arcApproximateCount = this.arcApproximationCount;
        const simpleLineApproximateCount = this.lineApproximationCount;
        this.profiles.forEach((_, iSection) => {
            if (iSection === 0) {
                return;
            }

            const intermediateProfilesCount = Math.ceil(sections / 2);

            const fromZ = zDiff * (iSection - 1);
            const toZ = zDiff * iSection;

            const fromProfileFigure = this.profiles[iSection - 1];
            const toProfileFigure = this.profiles[iSection];

            let fromPrimitives = fromProfileFigure.curve.primitives;
            let toPrimitives = toProfileFigure.curve.primitives;

            fromPrimitives = this.preprocessProfilePrimitives(
                fromPrimitives,
                arcApproximateCount,
                simpleLineApproximateCount
            );
            toPrimitives = this.preprocessProfilePrimitives(
                toPrimitives,
                arcApproximateCount,
                simpleLineApproximateCount
            );

            if (fromPrimitives.length !== toPrimitives.length) {
                console.warn('length of primitives are not similar: ', fromPrimitives, toPrimitives);
            }

            // construct profile with intermediate layers
            for (let intermI = 1; intermI <= intermediateProfilesCount; intermI++) {
                // first FROM layer
                const fromIntermI = intermI - 1;
                const fromCurrentPart = fromIntermI / intermediateProfilesCount;
                // second TO layer
                const currentPart = intermI / intermediateProfilesCount;
                const absoluteSectionI = (iSection - 1) * intermediateProfilesCount + fromIntermI;
                const group = new THREE.Group();

                fromPrimitives.forEach((_, i) => {
                    const fromPrimitive = fromPrimitives[i];
                    const toPrimitive = toPrimitives[i];

                    const fromVectors = fromPrimitive.getVectors().map(createWithZ.bind(null, fromZ));
                    const toVectors = toPrimitive.getVectors().map(createWithZ.bind(null, toZ));
                    const fromCurrentVectors = getIntermediateVectors(fromVectors, toVectors, fromCurrentPart);
                    const currentVectors = getIntermediateVectors(fromVectors, toVectors, currentPart);

                    const geometry = new THREE.Geometry();
                    geometry.vertices.push(
                        ...(fromCurrentVectors.map((vec) => new THREE.Vector3(vec.x, vec.y, vec.z))),
                        ...(currentVectors.map((vec) => new THREE.Vector3(vec.x, vec.y, vec.z))),
                    );

                    geometry.faces.push(new THREE.Face3(0, 1, 2), new THREE.Face3(3, 2, 1));
                    const mesh = new THREE.Mesh(geometry, profileMaterial);

                    const geo = new THREE.EdgesGeometry(mesh.geometry); // or WireframeGeometry
                    const wireframe = new THREE.LineSegments(geo, lineMaterial);
                    mesh.add(wireframe);

                    group.add(mesh);
                });

                this.profileLineMeshSections[absoluteSectionI] = group;
            }

            this.scene.add(...Object.values(this.profileLineMeshSections));
        });

        // creating profile plugs
        const startPlugI = 0;
        const endPlugI = (this.profiles.length - 1) || 0;

        const startPlugPrimitives = this.preprocessProfilePrimitives(
            this.profiles[startPlugI].curve.primitives,
            arcApproximateCount,
            1
        );
        const endPlugPrimitives = this.preprocessProfilePrimitives(
            this.profiles[endPlugI].curve.primitives,
            arcApproximateCount,
            1
        );

        const material = new THREE.MeshBasicMaterial({
            color: 0x800000,
            side: THREE.DoubleSide,
        });

        const startPlug = new THREE.Mesh(this.generateProfilePlug(startPlugPrimitives), material);
        const endPlug = new THREE.Mesh(this.generateProfilePlug(endPlugPrimitives), material);

        endPlug.translateZ(endPlugI * zDiff);
        this.plugs = new THREE.Group();
        this.plugs.add(startPlug);
        this.plugs.add(endPlug);
        this.scene.add(this.plugs);
    };

    /**
     * Generate plug geometry by profile
     * @param {LineShared[]} lines - profile lines
     * @return {THREE.Geometry}
     */
    generateProfilePlug(lines) {
        const shape = new THREE.Shape();
        shape.moveTo(lines[0].x1, lines[0].y1);
        lines.forEach((line) => {
            shape.lineTo(line.x2, line.y2);
        });
        shape.lineTo(lines[0].x1, lines[0].y1);
        return new THREE.ShapeGeometry(shape);
    }

    /**
     * Render rollers
     * @param {Object} obj
     * @param {Number} obj.zDiff - z diff between profile sections.
     */
    renderRollers({zDiff}) {
        // clean scene when rerender
        this.rollerGroupMeshes.forEach((group) => {
            dispose(group);
            this.scene.remove(group);
        });
        this.rollerGroupMeshes = [];
        // clean data when rerender
        this.rollerMeshes = [];

        this.rollers.forEach((stage, i) => {
            stage.forEach((roller) => {
                const primitives = roller.curve.primitives;
                const axis = primitives.find((primitive) => primitive.id === roller.axis_id);

                if (!axis) {
                    console.warn('No axis is defined for roller: ', roller);
                }

                const normalizedAxis = new THREE.Vector3(axis.x1, axis.y1, 0).sub(
                    new THREE.Vector3(axis.x2, axis.y2, 0)
                ).normalize();
                const yAxis = (new THREE.Vector3(0, 1, 0)).normalize();

                // rotation for roller to Y
                const toYQuaternion = new THREE.Quaternion();
                toYQuaternion.setFromUnitVectors(
                    normalizedAxis,
                    yAxis,
                );
                const toYMatrix = new THREE.Matrix4();
                toYMatrix.makeRotationFromQuaternion(toYQuaternion);

                // rotation for roller from Y
                const fromYQuaternion = new THREE.Quaternion();
                fromYQuaternion.setFromUnitVectors(
                    yAxis,
                    normalizedAxis,
                );
                const fromYMatrix = new THREE.Matrix4();
                fromYMatrix.makeRotationFromQuaternion(fromYQuaternion);

                let rollerPrimitives = roller.curve.primitives;
                rollerPrimitives = this.preprocessRollerPrimitives(
                    rollerPrimitives,
                    this.arcApproximationCount,
                    1,
                );

                const axisLine = new THREE.Line3(
                    new THREE.Vector3(axis.x1, axis.y1, 0),
                    new THREE.Vector3(axis.x2, axis.y2, 0)
                );
                axisLine.applyMatrix4(toYMatrix);

                const vectorFromYDiff = new THREE.Vector3();
                axisLine.closestPointToPoint(new THREE.Vector3(0, 0, 0), false, vectorFromYDiff);

                const rollerGeometry = new THREE.LatheGeometry(
                    rollerPrimitives.reduce((prev, line) => {
                        prev.push(new THREE.Vector3(line.x1, line.y1, 0).applyMatrix4(toYMatrix).sub(vectorFromYDiff));
                        prev.push(new THREE.Vector3(line.x2, line.y2, 0).applyMatrix4(toYMatrix).sub(vectorFromYDiff));
                        return prev;
                    }, []),
                    30,
                    0,
                    2 * Math.PI,
                );
                const rollerMaterial = new THREE.MeshBasicMaterial({color: 0xA0A0A0, side: THREE.DoubleSide});
                const rollerLathe = new THREE.Mesh(rollerGeometry, rollerMaterial);
                const geo = new THREE.EdgesGeometry(rollerLathe.geometry); // or WireframeGeometry
                const mat = new THREE.LineBasicMaterial({color: 0xffffff, linewidth: 2});
                const wireframe = new THREE.LineSegments(geo, mat);
                rollerLathe.add(wireframe);
                this.rollerMeshes.push(rollerLathe);

                // create group for local coordinate system
                const rollerGroup = new THREE.Group();
                rollerGroup.add(rollerLathe);

                rollerGroup.applyMatrix(fromYMatrix);
                const translateLength = vectorFromYDiff.length();
                const translateNormalized = vectorFromYDiff.normalize();
                rollerGroup.translateOnAxis(translateNormalized, translateLength);
                rollerGroup.translateZ(zDiff * i);

                this.rollerGroupMeshes.push(rollerGroup);
                this.scene.add(rollerGroup);
            });
        });
    }

    /**
     * Function starts animation
     */
    startAnimation = () => {
        if (!this.frameId) {
          this.frameId = requestAnimationFrame(this.animate)
        }
    };

    /**
     * Function stops animation
     */
    stopAnimation = () => {
        cancelAnimationFrame(this.frameId)
    };

    /**
     * Remove from scene start and end parts of profile needed for animation.
     */
    removeTempAnimationProfileMesh() {
        if (this.tempAnimationProfileMesh) {
            dispose(this.tempAnimationProfileMesh);
            this.scene.remove(this.tempAnimationProfileMesh);
            this.tempAnimationProfileMesh = null;
        }
    }

    /**
     * Function process animation
     */
    animate = () => {
        if (this.isStop) {
            this.removeTempAnimationProfileMesh();
            if (this.plugs) {
                this.plugs.visible = true;
            }
        } else {
            if (!this.isPaused) {
                this.currentAnimationPosition += 0.002;
                this.removeTempAnimationProfileMesh();
            }
            if (!this.isPaused || this.forceAnimationRerender) {
                this.forceAnimationRerender = false;
                if (this.plugs) {
                    this.plugs.visible = false;
                }
                if (this.currentAnimationPosition >= 1) {
                    this.currentAnimationPosition -= 1;
                }
                if (this.rollerMeshes) {
                    this.rollerMeshes.forEach((roller) => {
                        roller.rotation.y -= 0.01;
                    });
                }
                if (this.profileLineMeshSections) {
                    const meshesVarLength = this.profileLineMeshSections.length - this.showProfileAnimationLength;
                    const meshesVarCurrentPosition = meshesVarLength * this.currentAnimationPosition;
                    const minProfileMeshIndex = Math.floor(meshesVarCurrentPosition);

                    const startShowIndex = minProfileMeshIndex; // section animation starts from
                    const endShowIndex = minProfileMeshIndex + this.showProfileAnimationLength; // section animation ends to
                    this.profileLineMeshSections.forEach((section, i) => {
                        if (i <= startShowIndex || i + 1 > endShowIndex) {
                            section.visible = false;
                            return;
                        }
                        section.visible = true;
                    });

                    const intermediatePosition = meshesVarCurrentPosition - minProfileMeshIndex;
                    const prevToShowSection = this.profileLineMeshSections[startShowIndex];
                    const nextToShowSection = this.profileLineMeshSections[endShowIndex];

                    const createIntermediateProfile = (section, intermediatePosition, appear) => {
                        const group = new THREE.Group();
                        section.children.forEach((prevMesh) => {
                            const prevMaterial = prevMesh.material.clone();
                            const geometry = prevMesh.geometry.clone();

                            const getIntermediate = (left, right, val) => {
                                return left + (right - left) * val;
                            };

                            const vertices = geometry.vertices;
                            vertices[appear ? 2 : 0] = new THREE.Vector3(
                                getIntermediate(vertices[0].x, vertices[2].x, intermediatePosition),
                                getIntermediate(vertices[0].y, vertices[2].y, intermediatePosition),
                                getIntermediate(vertices[0].z, vertices[2].z, intermediatePosition),
                            );
                            vertices[appear ? 3 : 1] = new THREE.Vector3(
                                getIntermediate(vertices[1].x, vertices[3].x, intermediatePosition),
                                getIntermediate(vertices[1].y, vertices[3].y, intermediatePosition),
                                getIntermediate(vertices[1].z, vertices[3].z, intermediatePosition),
                            );
                            const mesh = new THREE.Mesh(geometry, prevMaterial);

                            const geo = new THREE.EdgesGeometry(mesh.geometry); // or WireframeGeometry
                            const mat = new THREE.LineBasicMaterial({color: 0xffffff, linewidth: 2});
                            const wireframe = new THREE.LineSegments(geo, mat);
                            mesh.add(wireframe);

                            group.add(mesh);
                        });
                        return group;
                    };

                    const prevIntermediateProfile = createIntermediateProfile(
                        prevToShowSection,
                        intermediatePosition,
                        false,
                    );
                    const nextIntermediateProfile = createIntermediateProfile(
                        nextToShowSection,
                        intermediatePosition,
                        true,
                    );

                    const tempAnimationProfileMesh = new THREE.Group();
                    tempAnimationProfileMesh.add(prevIntermediateProfile, nextIntermediateProfile);

                    const createPlugByIntermProfileMesh = (profile, isStart, material) => {
                        let indexFrom;
                        let indexTo;
                        if (isStart) {
                            indexFrom = 0;
                            indexTo = 1;
                        } else {
                            indexFrom = 2;
                            indexTo = 3;
                        }
                        const profileParts = profile.children;
                        const shape = new THREE.Shape();
                        shape.moveTo(
                            profileParts[0].geometry.vertices[indexFrom].x,
                            profileParts[0].geometry.vertices[indexFrom].y
                        );
                        for (let i = 1; i < profileParts.length; i++) {
                            const vertices = profileParts[i].geometry.vertices;
                            const to = vertices[indexTo];
                            shape.lineTo(to.x, to.y);
                        }
                        shape.lineTo(
                            profileParts[0].geometry.vertices[indexFrom].x,
                            profileParts[0].geometry.vertices[indexFrom].y
                        );
                        const geometry = new THREE.ShapeGeometry(shape);
                        const mesh = new THREE.Mesh(geometry, material);
                        mesh.translateZ(profileParts[0].geometry.vertices[indexFrom].z);
                        return mesh;
                    };

                    const plugMaterial = new THREE.MeshBasicMaterial({
                        color: 0x800000,
                        side: THREE.DoubleSide,
                    });

                    const prevPlug = createPlugByIntermProfileMesh(
                        prevIntermediateProfile,
                        true,
                        plugMaterial
                    );
                    const nextPlug = createPlugByIntermProfileMesh(
                        nextIntermediateProfile,
                        false,
                        plugMaterial
                    );

                    tempAnimationProfileMesh.add(prevPlug, nextPlug);

                    this.scene.add(tempAnimationProfileMesh);
                    this.tempAnimationProfileMesh = tempAnimationProfileMesh;
                }
            }
        }
        this.renderScene();
        this.frameId = window.requestAnimationFrame(this.animate)
    };

    /**
     * Function scene rerender
     */
    renderScene = () => {
        this.renderer.render(this.scene, this.camera)
    };

    /**
     * Change z distance between couple of main sections.
     * @param {Number} zDiff - z distance.
     */
    onZDiffChange = (zDiff) => {
        this.zDiff = zDiff;
    };

    /**
     * Change line count to approximate arc.
     * @param {Number} count - line count.
     */
    onArcApproximationCountChange = (count) => {
        this.arcApproximationCount = count;
    };

    /**
     * Change line count to approximate line.
     * @param {Number} count - line count.
     */
    onLineApproximationCountChange = (count) => {
        this.lineApproximationCount = count;
    };

    /**
     * Change additional sections count which renders between two main profiles.
     * @param {Number} count - additional sections count.
     */
    onAdditionalRenderingStagesChange = (count) => {
        this.additionalRenderingStages = count;
    };

    /**
     * Change length of profile that animated.
     * @param {Number} length - animated profile length.
     */
    onShowProfileAnimationLengthChange = (length) => {
        this.showProfileAnimationLength = length;
    };

    /**
     * Force rerender profiles and rollers.
     */
    forceRerenderAll = () => {
        this.renderAll();
    };

    /**
     * Start profile animation.
     */
    onProfileAnimationStart = () => {
        this.isStop = false;
        this.isPaused = false;
    };

    /**
     * Stop profile animation.
     */
    onProfileAnimationStop = () => {
        this.isStop = true;
        this.currentAnimationPosition = 0;
        this.profileLineMeshSections.forEach((section) => {
            section.visible = true;
        });
    };

    /**
     * Pause profile animation.
     */
    onProfileAnimationPause = () => {
        this.isPaused = true;
    };

    /**
     * Unpause profile animation.
     */
    onProfileAnimationUnpause = () => {
        this.isPaused = false;
    };

    /**
     * React DOM renderer
     * @returns {*}
     */
    render() {
        return(
            <>
                <div
                    style={{ width: '100%', height: '100vh', 'overflow': 'hidden' }}
                    ref={this.mount}
                />
                <Controller
                    zDiff={this.zDiff}
                    onZDiffSave={this.onZDiffChange}
                    arcApproximationCount={this.arcApproximationCount}
                    onArcApproximationCountSave={this.onArcApproximationCountChange}
                    lineApproximationCount={this.lineApproximationCount}
                    onLineApproximationCountSave={this.onLineApproximationCountChange}
                    additionalRenderingStages={this.additionalRenderingStages}
                    onAdditionalRenderingStagesSave={this.onAdditionalRenderingStagesChange}
                    showProfileAnimationLength={this.showProfileAnimationLength}
                    onShowProfileAnimationLengthSave={this.onShowProfileAnimationLengthChange}
                    onSave={this.forceRerenderAll}

                    onPlay={this.onProfileAnimationStart}
                    onStop={this.onProfileAnimationStop}
                    onPause={this.onProfileAnimationPause}
                    onUnpause={this.onProfileAnimationUnpause}
                />
            </>
        )
    };

    /**
     * Function fit canvas area to visible area
     */
    fitSize = () => {
        const width = this.mount.current.clientWidth;
        const height = this.mount.current.clientHeight;

        this.renderer.setSize(width, height);
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
    };
}


function createMockPrimitives() {
    return [
        [
            new ProfileFigure({
                curve: new CurveShared({
                    primitives: [
                        LineShared.fromVectors(
                            new VectorShared({
                                x: 17,
                                y: 0,
                                z: 0,
                            }),
                            new VectorShared({
                                x: 9,
                                y: 0,
                                z: 0,
                            })
                        ),
                        // arc
                        LineShared.fromVectors(
                            new VectorShared({
                                x: 9,
                                y: 0,
                                z: 0,
                            }),
                            new VectorShared({
                                x: 7,
                                y: 0,
                                z: 0,
                            })
                        ),
                        LineShared.fromVectors(
                            new VectorShared({
                                x: 7,
                                y: 0,
                                z: 0,
                            }),
                            new VectorShared({
                                x: -8,
                                y: 0,
                                z: 0,
                            }),
                        ),
                        LineShared.fromVectors(
                            new VectorShared({
                                x: -8,
                                y: 0,
                                z: 0,
                            }),
                            new VectorShared({
                                x: -17,
                                y: 0,
                                z: 0,
                            }),
                        ),
                        LineShared.fromVectors(
                            new VectorShared({
                                x: -17,
                                y: 0,
                                z: 0,
                            }),
                            new VectorShared({
                                x: -17,
                                y: -1,
                                z: 0,
                            }),
                        ),
                        LineShared.fromVectors(
                            new VectorShared({
                                x: -17,
                                y: -1,
                                z: 0,
                            }),
                            new VectorShared({
                                x: -8,
                                y: -1,
                                z: 0,
                            }),
                        ),
                        LineShared.fromVectors(
                            new VectorShared({
                                x: -8,
                                y: -1,
                                z: 0,
                            }),
                            new VectorShared({
                                x: 7,
                                y: -1,
                                z: 0,
                            }),
                        ),
                        // arc
                        LineShared.fromVectors(
                            new VectorShared({
                                x: 7,
                                y: -1,
                                z: 0,
                            }),
                            new VectorShared({
                                x: 9,
                                y: -1,
                                z: 0,
                            }),
                        ),
                        LineShared.fromVectors(
                            new VectorShared({
                                x: 9,
                                y: -1,
                                z: 0,
                            }),
                            new VectorShared({
                                x: 17,
                                y: -1,
                                z: 0,
                            }),
                        ),
                        LineShared.fromVectors(
                            new VectorShared({
                                x: 17,
                                y: -1,
                                z: 0,
                            }),
                            new VectorShared({
                                x: 17,
                                y: 0,
                                z: 0,
                            }),
                        ),
                    ]
                })
            }),
        ],
        [
            new ProfileFigure({
                curve: new CurveShared({
                    primitives: [
                        LineShared.fromVectors(
                            new VectorShared({
                                x: 8,
                                y: 9,
                                z: 0,
                            }),
                            new VectorShared({
                                x: 8,
                                y: 1,
                                z: 0,
                            })
                        ),
                        new ArcShared({
                            x: 7,
                            y: 1,
                            z: 0,
                            R: 1,
                            fi_start: 0,
                            fi_end: - Math.PI / 2,
                            direction: ArcDirections.CLOCKWISE,
                        }),
                        LineShared.fromVectors(
                            new VectorShared({
                                x: 7,
                                y: 0,
                                z: 0,
                            }),
                            new VectorShared({
                                x: -8,
                                y: 0,
                                z: 0,
                            }),
                        ),
                        LineShared.fromVectors(
                            new VectorShared({
                                x: -8,
                                y: 0,
                                z: 0,
                            }),
                            new VectorShared({
                                x: -8,
                                y: 9,
                                z: 0,
                            }),
                        ),
                        LineShared.fromVectors(
                            new VectorShared({
                                x: -8,
                                y: 9,
                                z: 0,
                            }),
                            new VectorShared({
                                x: -9,
                                y: 9,
                                z: 0,
                            }),
                        ),
                        LineShared.fromVectors(
                            new VectorShared({
                                x: -9,
                                y: 9,
                                z: 0,
                            }),
                            new VectorShared({
                                x: -9,
                                y: -1,
                                z: 0,
                            }),
                        ),
                        LineShared.fromVectors(
                            new VectorShared({
                                x: -9,
                                y: -1,
                                z: 0,
                            }),
                            new VectorShared({
                                x: 7,
                                y: -1,
                                z: 0,
                            }),
                        ),
                        new ArcShared({
                            x: 7,
                            y: 1,
                            z: 0,
                            R: 2,
                            fi_start: - Math.PI / 2,
                            fi_end: 0,
                            direction: ArcDirections.COUNTERCLOCKWISE,
                        }),
                        LineShared.fromVectors(
                            new VectorShared({
                                x: 9,
                                y: 1,
                                z: 0,
                            }),
                            new VectorShared({
                                x: 9,
                                y: 9,
                                z: 0,
                            }),
                        ),
                        LineShared.fromVectors(
                            new VectorShared({
                                x: 9,
                                y: 9,
                                z: 0,
                            }),
                            new VectorShared({
                                x: 8,
                                y: 9,
                                z: 0,
                            }),
                        ),
                    ]
                })
            }),
            new RollerFigure({
                curve: new CurveShared({
                    primitives: [
                        LineShared.fromVectors(
                            new VectorShared({
                                x: 8,
                                y: 15,
                                z: 0,
                            }),
                            new VectorShared({
                                x: 8,
                                y: 9,
                                z: 0,
                            })
                        ),
                        LineShared.fromVectors(
                            new VectorShared({
                                x: 8,
                                y: 9,
                                z: 0,
                            }),
                            new VectorShared({
                                x: 8,
                                y: 1,
                                z: 0,
                            })
                        ),
                        new ArcShared({
                            x: 7,
                            y: 1,
                            z: 0,
                            R: 1,
                            fi_start: 0,
                            fi_end: - Math.PI / 2,
                            direction: ArcDirections.CLOCKWISE,
                        }),
                        LineShared.fromVectors(
                            new VectorShared({
                                x: 7,
                                y: 0,
                                z: 0,
                            }),
                            new VectorShared({
                                x: -8,
                                y: 0,
                                z: 0,
                            }),
                        ),
                        LineShared.fromVectors(
                            new VectorShared({
                                x: -8,
                                y: 0,
                                z: 0,
                            }),
                            new VectorShared({
                                x: -8,
                                y: 9,
                                z: 0,
                            }),
                        ),
                        LineShared.fromVectors(
                            new VectorShared({
                                x: -8,
                                y: 9,
                                z: 0,
                            }),
                            new VectorShared({
                                x: -8,
                                y: 15,
                                z: 0,
                            }),
                        ),
                        LineShared.fromVectors(
                            new VectorShared({
                                x: 8,
                                y: 15,
                                z: 0,
                            }),
                            new VectorShared({
                                x: -8,
                                y: 15,
                                z: 0,
                            }),
                            'hardcoded_id_top'
                        )
                    ]
                }),
                axis_id: 'hardcoded_id_top'
            }),
            new RollerFigure({
                curve: new CurveShared({
                    primitives: [
                        LineShared.fromVectors(
                            new VectorShared({
                                x: 11,
                                y: 11,
                                z: 0,
                            }),
                            new VectorShared({
                                x: 9,
                                y: -1,
                                z: 0,
                            })
                        ),
                        LineShared.fromVectors(
                            new VectorShared({
                                x: 9,
                                y: -1,
                                z: 0,
                            }),
                            new VectorShared({
                                x: -9,
                                y: -1,
                                z: 0,
                            }),
                        ),
                        LineShared.fromVectors(
                            new VectorShared({
                                x: -9,
                                y: -1,
                                z: 0,
                            }),
                            new VectorShared({
                                x: -11,
                                y: 11,
                                z: 0,
                            }),
                        ),
                        LineShared.fromVectors(
                            new VectorShared({
                                x: -11,
                                y: 11,
                                z: 0,
                            }),
                            new VectorShared({
                                x: -11,
                                y: -5,
                                z: 0,
                            }),
                        ),
                        LineShared.fromVectors(
                            new VectorShared({
                                x: -11,
                                y: -5,
                                z: 0,
                            }),
                            new VectorShared({
                                x: 11,
                                y: -5,
                                z: 0,
                            }),
                            'hardcoded_id',
                        ),
                        LineShared.fromVectors(
                            new VectorShared({
                                x: 11,
                                y: -5,
                                z: 0,
                            }),
                            new VectorShared({
                                x: 11,
                                y: 11,
                                z: 0,
                            }),
                        ),
                    ]
                }),
                axis_id: 'hardcoded_id'
            }),
            // add more figures here
        ],
        // add more layers here
    ]
}
