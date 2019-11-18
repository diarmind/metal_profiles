import React from 'react';
import * as TrackballControls from 'three-trackballcontrols';
import * as THREE from 'three';
import {THREEx} from './threex.domevents.js';
//const THREEx = require('threex');
import {SharedFormats, LineShared, ArcShared, Angle, CurveShared, EquidArc, Roll} from './Curve.js';
import {drawLine, drawPoint} from './LineBuilder.js';
import {GetEquidPoints, getEquidistantPoint, getVectorsAngle, CreateIndent, getAngleLen, getUnitVector} from './Equid.js';
import {buildFromLRA} from './LRABuilder';
import {TransMatrix, SumMatrix, MinusMatrix, multMatrixNumber, MultiplyMatrix, MultyplyMatrixVector, MatrixRoot, MultiplyVector, Determinant, radToDeg, degToRad} from './matrix.js';




function clearThree(obj){				//функция очистки объекта ThreeJS при удалении
	while(obj.children.length > 0){ 
		clearThree(obj.children[0])
		obj.remove(obj.children[0]);
	}
	if(obj.geometry) obj.geometry.dispose()
	if(obj.material) obj.material.dispose()
	if(obj.texture) obj.texture.dispose()
}

export default class RollerEditor extends React.Component {
	constructor(props) {
		super(props);

		this.camera = null;
		this.scene = null;
		this.controls = null;
		this.renderer = null;

		this.state = {
			isEditing: false,		//переменная состояния редактирования валков
			selectedColor: '#00E060',		//активный цвет
			selectedId: '',		//id обрабатываемого валка
			rolls: {}, 			//ассоциированный масив валков
		}
		
	}

	onRollsListChange = (event) => {		//отслеживание изменений в списке валков
	    this.setState({
	    	selectedColor: event.target.dataset.color,
	    	selectedId: event.target.dataset.id,
	    });
	};

	changeMode = (event) => {		//событие активации режима редактирования
		const {isEditing} = this.state;
		this.setState({
			isEditing: !isEditing,
		});
	};

	onSaveRoll = (event) => {		//сохранение валка
		const {rolls, selectedId, selectedColor} = this.state;
    	rolls[selectedId].setColor(selectedColor);
    	rolls[selectedId].getAxis();
    	this.setState({
    		rolls: rolls,
    	}); // TODO check
    };

	componentDidMount() {
		const localStorage = window.localStorage;
		let globalBias = localStorage.getItem('globalBias');
		if (globalBias === null) {
			globalBias = Number(prompt('Для продолжения создания профилей пожалуйста в'));
			localStorage.setItem('globalBias', globalBias);
		} else {
			globalBias = Number(globalBias);
		}

		//globalBias = 5;

		const container = document.querySelector("#container");		//инициализация контейнера сцены
		const scene = new THREE.Scene();	//инициализация сцены
		this.scene = scene;
		let w = screen.width;
		let h = screen.height;
		const defaultColor = 0x000000;	//цвет линий по умолчанию
		const camera = new THREE.OrthographicCamera( w / - 8, w / 8, h / 8, h / - 8, 2, 1000 );	//инициализация камеры
		this.camera = camera;
		const renderer = new THREE.WebGLRenderer();	//инициализация рендера
		this.renderer = renderer;
		renderer.setSize( window.innerWidth, window.innerHeight );
		container.appendChild(renderer.domElement);
		scene.add(camera);	//добавление камеры к сцене
		let controls = new TrackballControls(camera, renderer.domElement);
		this.controls = controls;

		scene.background = new THREE.Color(0xfafafa);	//добавление цвета сцены

		camera.position.z = 30;		//изначальная позиция камеры
		camera.position.y = 0;
		camera.position.x = 0;

		let lastRoll = 1;		//порядковый номер последнего добавленного валка
		let smoothing = 0.5;
		console.log(THREEx);
		const domEvents = new THREEx.DomEvents(camera, renderer.domElement);	//объект для управления событиями

		//кнопка редактирования

		const editBtn = document.getElementById('edit-roll-btn');	//кнопка редактирования
		const rollsListConteiner = document.getElementById('rolls-list');	//список валков
		let colorDiv = document.getElementById('rolls-color-set');		//кнопка изменения цвета
		const saveRoll = document.getElementById('save-roll');		//кнопка сохранения валка
		const chageBiasBtn = document.getElementById('change-bias');

		let objects = [					//тестовый объект
			// {
			// 	L: [50,0,70,0,100,0,60],
			// 	R: [0,20,0,50,0,80,0],
			// 	A: [0,45,0,60,0,120,0],
			// 	ac: 7,
			// 	ax: 80,
			// 	ay: 40,
			// 	az: 0,
			// 	aa: 0,
			// },
			{
				L: [50,0,70,0,50],
				R: [0,20,0,20,0],
				A: [0,60,0,60,0],
				ac: 3.5,
				ax: 20,
				ay: 30,
				az: 0,
				aa: 0,
			},
		];

		let ExternalEquidCurve;
		let InteriorEquidCurve;

		objects.forEach((element, index) => {		//обработка переданных данных
			let res = buildFromLRA(element, globalBias, domEvents, scene);		//результат построение исходного и эквидистантных профилей
			let mainCurve = res[0];
			mainCurve.draw();					//отрисовка нейтрального профиля
			InteriorEquidCurve = res[1];
			InteriorEquidCurve.draw();			//отрисовка внутреннего эквидистантного профиля
			ExternalEquidCurve = res[2];
			ExternalEquidCurve.draw();			//отрисовка внешнего эквидистантного профиля
		});

		this.animate();
	}

	onChangeCurrentColor = (e) => {
		const {rolls, selectedId} = this.state;
		rolls[selectedId].setColor(selectedColor);
		this.setState({
			currentColor: e.target.value,
			rolls: rolls,
		});
	};

	onDropRoll = (e) => {
		const {rolls} = this.state;
		const rollId = e.target.getAttribute('data-id');
		rolls[rollId].dropRoll();
		delete rolls[rollId];
		this.setState({
			rolls: rolls,
			selectedId: null,
		});
	};

	render() {
		const {isEditing, selectedId, currentColor, rolls} = this.state;
		return (
		<>
			<div style={{position: "relative", width: "100%", height: "100%"}}>
		    <div id="container"></div>
		    <div id="axes" style={{position: "absolute", top: "0px", left: "0px"}}></div>
			<div>
				<button 
				  	id="edit-roll-btn" 
				  	style={{position: "absolute", top: "20px"}}  
				  	className="b7"
				  	onClick={this.changeMode}
		  		>
		  			{isEditing ? "Отмена" : "Редактирование валков"}
	  			</button>
				<div id='rolls-list' style={{position: "absolute", top: "60px"}} onChange={this.onRollsListChange}>
					{Object.values(rolls).map((roll, i) => {
						return (
							<label
								key={i}
								style={{
									backgroundColor: roll.color,
									left: "10",
									border: "1px solid",
									padding: ".3em 1em calc(.5em + 1px)",
									boxShadow: "0 -3px rgb(53,167,110) inset",
									borderRadius: "3px",
								}}
							>
								<span>Валок {roll.id}</span>
								<input 
									type="radio"
									name="rolls"
									data-id={roll.id}
									data-color={roll.color}
								/>
								<button 
									type="button" 
									title="Удалить"
									data-id={roll.id}
									onClick={this.onDropRoll}
								>
									Удалить валок {roll.id}
								</button>
							</label>
						)
					})}
				</div>
				{isEditing && selectedId && (
					<>
						{Object.keys(rolls).length && (
					  		<div id='rolls-color-set' style={{position: "absolute", top: "140px"}}>
					  			<input 
					  				type="color" 
					  				value={currentColor} 
					  				onChange={onChangecurrentColor} 
					  				title="Выберите цвет для линий валка"
								/>
							</div>
						)}
						<div id='save-roll' style={{position: "absolute", top: "95px"}}>
							<button onClick={this.onSaveRoll}>Сохранить</button>
						</div>
					</>
				)}
		      
			</div>
			</div>
		</>
	)}

	animate = () => {				//функция анимирования и рендеринга событий
		requestAnimationFrame(this.animate);
		this.controls.update();
		this.renderer.render(this.scene, this.camera);
	};
}
