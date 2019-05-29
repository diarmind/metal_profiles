import React from 'react';
import * as THREE from "three";
import * as OrbitControls from 'three-orbitcontrols';

import Controller from './components/Controller/Controller.jsx';


export default class Roller extends React.Component {
    constructor(props) {
        super(props);

        this.mount = React.createRef();

        this.scene = null;
        this.camera = null;
        this.renderer = null;

        this.cube = null;
        this.profileLines = [];
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
    initProfiles() {
        this.addCube();
        this.startAnimation();

        let {dataIn} = this.props;
        dataIn = createMockPrimitives();
        let linesTest = [[
            {
                x: 10,
                y: 10,
                z: 0,
            },
            {
                x: 8,
                y: 0,
                z: 0,
            },
            {
                x: -8,
                y: 0,
                z: 0,
            },
            {
                x: -8,
                y: 10,
                z: 0,
            }
        ], [
            {
                x: 12,
                y: 10,
                z: 10,
            },
            {
                x: 8,
                y: 0,
                z: 10,
            },
            {
                x: -8,
                y: 0,
                z: 10,
            },
            {
                x: -12,
                y: 10,
                z: 10,
            }
        ]];
        linesTest.forEach((line) => {
            this.addProfileLine(line.map(vectorCoords => Object.values(vectorCoords)));
        });
    }

    componentDidMount() {
        this.initScene();
        this.initHelpers();
        this.initProfiles();

        window.addEventListener('resize', this.fitSize);
    }

    componentWillUnmount(){
        window.removeEventListener('resize', this.fitSize);

        this.stopAnimation();
        this.mount.current.removeChild(this.renderer.domElement);
    }

    /**
     * Function add cube (for testing animation)
     */
    addCube = () => {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshBasicMaterial({color: '#433F81'});
        this.cube = new THREE.Mesh(geometry, material);
        this.scene.add(this.cube);
    };

    /**
     * Function initializes and add ONE profile line
     */
    addProfileLine = (lineCoords) => {
        const lineMaterial = new THREE.LineBasicMaterial({
            color: '#0000ff',
            linewidth: 1,
        });

        const lineGeometry = new THREE.Geometry();
        lineGeometry.vertices.push(
            ...lineCoords.map(coords => new THREE.Vector3(...coords))
        );
        const line = new THREE.Line(lineGeometry, lineMaterial);
        this.scene.add(line);
        this.profileLines.push(line);
    };

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
     * Function process animation
     */
    animate = () => {
       this.cube.rotation.x += 0.01;
       this.cube.rotation.y += 0.01;
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
     * React DOM renderer
     * @returns {*}
     */
    render(){
        return(
            <>
                <div
                    style={{ width: '100%', height: '100vh', 'overflow': 'hidden' }}
                    ref={this.mount}
                />
                <Controller/>
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


// mock
import {RollerFigure, ProfileFigure} from "../../shared/figures.js";
import {LineShared, CurveShared, ArcShared, VectorShared} from "../../shared/formats.js";

function createMockPrimitives() {
    return [
        [
            new ProfileFigure({
                curve: new CurveShared({
                    primitives: [
                        LineShared.fromVectors(
                            new VectorShared({
                                x: 10,
                                y: 10,
                                z: 0,
                            }),
                            new VectorShared({
                                x: 8,
                                y: 0,
                                z: 0,
                            })
                        ),
                        LineShared.fromVectors(
                            new VectorShared({
                                x: 8,
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
                                y: 10,
                                z: 0,
                            }),
                        )
                    ]
                })
            }),
            new RollerFigure({
                curve: new CurveShared({
                    primitives: [
                        LineShared.fromVectors(
                            new VectorShared({
                                x: 10,
                                y: 10,
                                z: 0,
                            }),
                            new VectorShared({
                                x: 8,
                                y: 0,
                                z: 0,
                            })
                        ),
                        LineShared.fromVectors(
                            new VectorShared({
                                x: 8,
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
                                y: 10,
                                z: 0,
                            }),
                        ),
                        LineShared.fromVectors(
                            new VectorShared({
                                x: -8,
                                y: 10,
                                z: 0,
                            }),
                            new VectorShared({
                                x: -8,
                                y: -5,
                                z: 0,
                            }),
                        ),
                        LineShared.fromVectors(
                            new VectorShared({
                                x: -8,
                                y: -5,
                                z: 0,
                            }),
                            new VectorShared({
                                x: 8,
                                y: -5,
                                z: 0,
                            }),
                            'hardcoded_id',
                        ),
                        LineShared.fromVectors(
                            new VectorShared({
                                x: 8,
                                y: -5,
                                z: 0,
                            }),
                            new VectorShared({
                                x: 8,
                                y: 10,
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
