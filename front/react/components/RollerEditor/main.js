"use strict";

let globalBias = localStorage.getItem('globalBias');
if (globalBias === null) {
	globalBias = Number(prompt('Для продолжения создания профилей пожалуйста в'));
	localStorage.setItem('globalBias', globalBias);
} else {
	globalBias = Number(globalBias);
}

globalBias = 5;

const container = document.querySelector("#container");		//инициализация контейнера сцены
var scene = new THREE.Scene();	//инициализация сцены
let w = screen.width;
let h = screen.height;
const defaultColor = 0x000000;	//цвет линий по умолчанию
var camera = new THREE.OrthographicCamera( w / - 8, w / 8, h / 8, h / - 8, 2, 1000 );	//инициализация камеры
// var camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1, 1000 );
var renderer = new THREE.WebGLRenderer();	//инициализация рендера
renderer.setSize( window.innerWidth, window.innerHeight );
container.appendChild(renderer.domElement);
scene.add(camera);	//добавление камеры к сцене
let controls = new THREE.TrackballControls(camera, renderer.domElement);

scene.background = new THREE.Color(0xfafafa);	//добавление цвета сцены

camera.position.z = 30;		//изначальная позиция камеры
camera.position.y = 0;
camera.position.x = 0;

let lastRoll = 1;		//порядковый номер последнего добавленного валка
let smoothing = 0.5;

const domEvents = new THREEx.DomEvents(camera, renderer.domElement);	//объект для управления событиями

//кнопка редактирования

const editBtn = document.getElementById('edit-roll-btn');	//кнопка редактирования
const rollsListConteiner = document.getElementById('rolls-list');	//список валков
let colorDiv = document.getElementById('rolls-color-set');		//кнопка изменения цвета
const saveRoll = document.getElementById('save-roll');		//кнопка сохранения валка
const chageBiasBtn = document.getElementById('change-bias');
let isEditing = false;		//переменная состояния редактирования валков
let selectedColor = '';		//активный цвет
let selectedId = '';		//id обрабатываемого валка
let rolls = {}; 			//ассоциированный масив валков

rollsListConteiner.addEventListener('change', (event) => {		//отслеживание изменений в списке валков
    selectedColor = event.target.dataset.color;
    selectedId = event.target.dataset.id;
})

// chageBiasBtn.addEventListener('click', (event) => {
// 	globalBias = Number(prompt('Для продолжения создания профилей пожалуйста в'));
// 	localStorage.setItem('globalBias', globalBias);
// });

editBtn.addEventListener('click', (event) => {		//событие активации режима редактирования
	isEditing = !isEditing;

	if (isEditing) {		//переход к редактированию
        let addBtn = document.createElement('button');
        addBtn.innerHTML = 'Добавить Валок';
        rollsListConteiner.appendChild(addBtn);
        editBtn.innerHTML = 'Остановить режим редактирования валков';
        for (let el in rolls) {
        	addRollElementHTML(rolls[el]);
        }
	    let saveBtn = document.createElement('button');
	    saveBtn.innerHTML = 'Сохранить';
	    saveBtn.addEventListener('click', (event) =>{		//сохранение валка
	    	rolls[selectedId].setColor(selectedColor);
	    	rolls[selectedId].getAxis();
	    });
	    saveRoll.appendChild(saveBtn);
        addBtn.addEventListener('click', addBtnEvent);
      } else {												//выход из редактирования
        editBtn.innerHTML = 'Редактирование валков';
        rollsListConteiner.innerHTML = '';
        colorDiv.innerHTML = '';
        saveRoll.innerHTML = '';
      }

});

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
	let res = buildFromLRA(element, 0);		//результат построение исходного и эквидистантных профилей
	let mainCurve = res[0];
	mainCurve.draw();					//отрисовка нейтрального профиля
	InteriorEquidCurve = res[1];
	InteriorEquidCurve.draw();			//отрисовка внутреннего эквидистантного профиля
	ExternalEquidCurve = res[2];
	ExternalEquidCurve.draw();			//отрисовка внешнего эквидистантного профиля
});

var animate = function () {				//функция анимирования и рендеринга событий
	requestAnimationFrame(animate);
	controls.update();
	renderer.render(scene, camera);
};

function clearThree(obj){				//функция очистки объекта ThreeJS при удалении
  while(obj.children.length > 0){ 
    clearThree(obj.children[0])
    obj.remove(obj.children[0]);
  }
  if(obj.geometry) obj.geometry.dispose()
  if(obj.material) obj.material.dispose()
  if(obj.texture) obj.texture.dispose()
}

function addRollElementHTML(el) {						//добавление валка в список
	let rollLabel = document.createElement('label');
	let roll = document.createElement('input');
	rollLabel.style.backgroundColor = el.color;
	rollLabel.style.left = "10";
	rollLabel.style.border = "1px solid";
	rollLabel.style.padding = ".3em 1em calc(.5em + 1px)";
	rollLabel.style.boxShadow = "0 -3px rgb(53,167,110) inset";
	rollLabel.style.borderRadius = "3px";
	rollLabel.innerHTML = `Валок ${el.id}`;
	roll.type = 'radio';
	roll.name = 'rolls';
	if (el.id == selectedId) {
		roll.checked = true;
	}

	let rollDel = document.createElement('button');
	rollDel.innerHTML = `Удалить валок ${el.id}`;

	rollDel.addEventListener('click', (event) => {
		rolls[el.id].dropRoll();
		delete rolls[el.id];
		selectedId = undefined;
		startEditing();
	});

	roll.background = el.color;
	roll.dataset.color = el.color;
	roll.dataset.id = el.id;
	rollLabel.appendChild(roll);
	rollLabel.appendChild(rollDel);
	rollsListConteiner.appendChild(rollLabel);
}

function addBtnEvent() {				//добавление обработчика событий для кнопки "Добавить"
    colorDiv.innerHTML = '';
    selectedColor = "#00E060";//0x00E060;
    let newRoll = new Roll({color: selectedColor, id: lastRoll++});
    rolls[newRoll.id] = newRoll;
    selectedId = newRoll.id;
    addRollElementHTML(newRoll);
    let colorInput = document.createElement('input');
    colorInput.type = "color";
    colorInput.value = "#00E060";//selectedColor;
    colorInput.name = "Выберите цвет для линий валка";
    colorInput.addEventListener('change', (event) => {
	    selectedColor = colorInput.value;
	    rollsListConteiner.innerHTML = '';
		let addBtn = document.createElement('button');
		addBtn.innerHTML = 'Добавить Валок';
		rollsListConteiner.appendChild(addBtn);
	    rolls[selectedId].setColor(selectedColor);
		for (let el in rolls) {
		    addRollElementHTML(rolls[el]);
		}
    });
    colorDiv.appendChild(colorInput);
}

function startEditing() {						//начало редактирования
        rollsListConteiner.innerHTML = '';
        colorDiv.innerHTML = '';
        saveRoll.innerHTML = '';
        let addBtn = document.createElement('button');
        addBtn.innerHTML = 'Добавить Валок';
        rollsListConteiner.appendChild(addBtn);
        editBtn.innerHTML = 'Остановить режим редактирования валков';
        for (let el in rolls) {
        	addRollElementHTML(rolls[el]);
        }
	    let saveBtn = document.createElement('button');
	    saveBtn.innerHTML = 'Сохранить';
	    saveBtn.addEventListener('click', (event) =>{
	    	rolls[selectedId].setColor(selectedColor);
	    	rolls[selectedId].getAxis();
	    });
	    saveRoll.appendChild(saveBtn);
        addBtn.addEventListener('click', addBtnEvent);
}

animate();