<template>
  <div :class="{ 'pan-enabled': isPanEnabled }" id="app">
    <div
      ref="canvasParent"
      id="canvas-wrapper"
      style="height: 100vh"
    ></div>
    <div id="sidebar">
      <button
        @click="startDrawing"
        class="btn"
        id="draw-btn"
      >
        Построить профиль
      </button>
      <button
        class="btn"
        id="import-btn"
        @click="toggleImportPopup"
      >
        Экспертный режим
      </button>
      <label class="toggle-label">
        <span >Размеры</span>
        <input @input="enableProfileDimensions" type="checkbox">
      </label>
      <label class="toggle-label">
        <span >Нумерация</span>
        <input @input="enableProfileNumbering" type="checkbox">
      </label>
    </div>
    <!-- popup for current hints -->
    <div id="hint-popup">

    </div>
    <div id="position-bar">
      <span id="current-zoom">{{ 'x' + currentZoom.value }}</span>
      <button
        @click="currentZoom.value += 0.5"
        class="zoom-btn zoom-btn_plus"
        :disabled="currentZoom.value >= 5"
      >+</button>
      <button
        @click="currentZoom.value -= 0.5"
        class="zoom-btn zoom-btn_minus"
        :disabled="currentZoom.value <= 0.51"
      >-</button>
      <input v-model="isPanEnabled" id="enablePan" type="checkbox">
      <label class="checkbox-label" for="enablePan">
        <img class="checkbox-label__icon" src="./assets/move.svg">
      </label>
    </div>
    <!-- general information bottom right corner -->
    <div id="info-bar">
      <p v-show="profileLength !== '0.00'">Длина профиля: {{ profileLength }}</p>
    </div>

    <!-- import profile popup -->
    <transition>
      <div v-show="isImportPopupVisible" id="overlay">
        <div class="import-popup">
          <label>
            Количество элементов в профиле:
            <input class="number-input" v-model.number="numberOfParts" type="number">
          </label>
          <button
            @click="fillVectors"
            :disabled="!numberOfParts"
            class="btn"
          >
            Подтвердить
          </button>
          <div class="separator"></div>
          <section v-show="L.length !== 0" id="vectors">
            <div>
              <label class="vector-group">
                Вектор L:
                <input
                  v-for="(el, index) of L"
                  :key="index"
                  v-model.number="el.value"
                  class="number-input"
                  type="number">
              </label>
              <label class="vector-group">
                Вектор R:
                <input
                  v-for="(el, index) of R"
                  :key="index"
                  v-model.number="el.value"
                  class="number-input"
                  type="number">
              </label>
              <label class="vector-group">
                Вектор A:
                <input
                  v-for="(el, index) of A"
                  :key="index"
                  v-model.number="el.value"
                  class="number-input"
                  type="number">
              </label>
            </div>
          </section>
          <section v-show="L.length !== 0">
            <div class="separator"></div>
            <label>
              Смещение по оси X:
              <input class="number-input" v-model.number="axisX" type="number">
            </label>
            <br>
            <label>
              Смещение по оси Y:
              <input class="number-input" v-model.number="axisY" type="number">
            </label>
            <br>
            <label>
              Положение системы координат профиля:
              <input class="number-input" v-model.number="axisCenter" type="number">
            </label>
            <br>
            <label>
              Поворот системы координат профиля:
              <input class="number-input" v-model.number="axisAngle" type="number">
            </label>
            <div class="separator"></div>
          </section>

          <div class="button-set">
            <button
              class="btn btn_action button-set__button"
              @click="importPorfile"
            >
              Импортировать
            </button>
            <button
              class="btn button-set__button"
              @click="toggleImportPopup"
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </transition>
    <!-- profile element params popup -->
    <transition>
      <div v-show="isPartInfoVisible" class="part-params">
        <label v-show="selectedLength > 0">
          L:
          <input
            class="number-input"
            v-model.number="selectedL"
            type="number"
          >
        </label>
        <label v-show="selectedRadius > 0">
          R:
          <input
            class="number-input"
            v-model.number="selectedR"
            type="number"
          >
        </label>
        <label v-show="selectedAngle !== 0">
          A:
          <input
            class="number-input"
            v-model.number="selectedA"
            type="number"
          >
        </label>
        <div class="separator"></div>
        <button
          @click="rebuildProfile"
          class="btn btn_action part-params__btn"
        >
          Применить
        </button>
        <br>
        <button
          @click="closePartParams"
          class="btn part-params__btn"
        >
          Закрыть
        </button>
      </div>
    </transition>
    <!-- confirm axis center popup -->
    <div v-show="selectedAC.index !== -1" class="part-params">
      <label >
        Центр локальной системы координат:
        <input
          class="number-input"
          v-model.number="selectedAC.index"
          type="number"
        >
      </label>
      <div class="separator"></div>
      <button
        @click="completeDrawing"
        class="btn btn_action part-params__btn"
      >
        Подтвердить
      </button>
    </div>
  </div>
</template>

<script>
import p5 from 'p5';
import { sketch } from './sketch.js';
import Draft from './Draft.js';
import Converter from './Converter.js';
import CollisionDetector from './CollisionDetector.js';
import HintBar from './components/HintBar.vue';

export default {
  name: 'app',
  components: {
    HintBar
  },
  data() {
    return {
      P5: null,
      draft: null,
      collisionDetector: null,
      L: [],
      R: [],
      A: [],
      importedProfile: null,
      axisCenter: 0,
      axisX: 0,
      axisY: 0,
      axisAngle: 0,
      numberOfParts: '',
      selectedElement: { index: -1 },
      selectedAC: { index: -1 },
      selectedL: '',
      selectedR: '',
      selectedA: '',
      isImportPopupVisible: false,
      currentZoom: { value: 1 },
      isPanEnabled: false
    };
  },
  mounted() {
    this.draft = new Draft();
    this.collisionDetector = new CollisionDetector();
    this.P5 = new p5(sketch(this.draft, this.collisionDetector, this.$refs.canvasParent));
    this.draft.collisionDetector = this.collisionDetector;
    this.draft.selectedElement = this.selectedElement;
    this.draft.drawingAxisCenterSelected = this.selectedAC;
    this.draft.currentZoom = this.currentZoom;
  },
  beforeDestroy() {
     window.vueSetOut({
      l: this.L.map((el) => el.value),
      r: this.R.map((el) => el.value),
      a: this.A.map((el) => el.value),
      ac: this.axisCenter,
      ax: this.axisX,
      ay: this.axisY,
      aa: this.axisAngle
    });
  },
  watch: {
    isPanEnabled() {
      console.log('pan');
      this.draft.isPanning = this.isPanEnabled;
    }
  },
  computed: {
    profileLength() {
      let len = 0;
      for (let i = 0; i < this.L.length; i++) {
        if (this.L[i].value !== 0) {
          len += this.L[i].value;
        } else {
          len += Math.PI * this.R[i].value * this.A[i].value / 180;
        }
      }
      return len.toFixed(2);
    },
    isPartInfoVisible() {
      return this.selectedElement.index === -1 ? false : true;
    },
    selectedLength() {
      if (this.selectedElement.index === -1) {
        this.selectedL = -1;
        return -1;
      } else {
        this.selectedL = this.L[this.selectedElement.index].value;
        return this.L[this.selectedElement.index].value;
      }
    },
    selectedRadius() {
      if (this.selectedElement.index === -1) {
        this.selectedR = -1;
        return -1;
      } else {
        this.selectedR = this.R[this.selectedElement.index].value;
        return this.R[this.selectedElement.index].value;
      }
    },
    selectedAngle() {
      if (this.selectedElement.index === -1) {
        this.selectedA = -1;
        return -1;
      } else {
        this.selectedA = this.A[this.selectedElement.index].value;
        return this.A[this.selectedElement.index].value;
      }
    }
  },
  methods: {
    importPorfile() {
      let l = this.L.map((el) => el.value);
      let r = this.R.map((el) => el.value);
      let a = this.A.map((el) => el.value);
      this.draft.l = l;
      this.draft.r = r;
      this.draft.a = a;
      this.draft.makeProfileTransformMatrices(this.axisX, this.axisY, this.axisAngle);
      this.importedProfile = Converter.vectorsToPrimitives(l, r, a, this.axisCenter, this.axisX, this.axisY);
      this.draft.import = this.importedProfile;
      console.log(this.draft.import);
      this.draft.collisionMap = this.collisionDetector.buildCollisionMap(this.importedProfile.elements);
      this.draft.firstElementIndex = Math.floor(this.axisCenter) - 1;
      this.draft.calcInfoPositions();
      this.toggleImportPopup();
    },
    toggleImportPopup() {
      this.isImportPopupVisible = !this.isImportPopupVisible;
    },
    fillVectors() {
      if (this.L.length === this.numberOfParts) {
        return;
      }
      if (this.L.length > this.numberOfParts) {
        this.L = this.L.slice(0, this.numberOfParts);
        this.R = this.R.slice(0, this.numberOfParts);
        this.A = this.A.slice(0, this.numberOfParts);
        return;
      }
      if (this.L.length < this.numberOfParts) {
        let numberOfNew = this.numberOfParts - this.L.length;
        for (let i = 0; i < numberOfNew; i++) {
          this.L.push({ value: 0 });
          this.R.push({ value: 0 });
          this.A.push({ value: 0 });
        }
        return;
      }
    },
    closePartParams() {
      this.selectedElement.index = -1;
    },
    isParamsChanged() {
      if (this.selectedLength !== this.selectedL) {
        return true;
      }
      if (this.selectedRadius !== this.selectedR) {
        return true;
      }
      if (this.selectedAngle !== this.selectedA) {
        return true;
      }
      return false;
    },
    rebuildProfile() {
      if (!this.isParamsChanged()) {
        return;
      }
      console.log('parametrs changed');
      let elToChange = this.selectedElement.index;
      this.L[elToChange].value = this.selectedL;
      this.R[elToChange].value = this.selectedR;
      this.A[elToChange].value = this.selectedA;

      let l = this.L.map((el) => el.value);
      let r = this.R.map((el) => el.value);
      let a = this.A.map((el) => el.value);
      this.draft.l = l;
      this.draft.r = r;
      this.draft.a = a;

      if (elToChange === (Math.floor(this.axisCenter) - 1)) {
        this.importedProfile = Converter.vectorsToPrimitives(l, r, a, this.axisCenter, this.axisX, this.axisY);
        this.draft.import = this.importedProfile;
      } else {
        Converter.recalcProfile(l, r, a, this.axisCenter, this.importedProfile, elToChange);
      }
      this.draft.collisionMap = this.collisionDetector.buildCollisionMap(this.importedProfile.elements);
      this.draft.calcInfoPositions();
      this.closePartParams();
    },
    startDrawing() {
      this.draft.isDrawing = true;
    },
    completeDrawing() {
      let axisParams = this.draft.calcDrawingAxisPos();
      this.axisCenter = this.selectedAC.index;
      this.axisAngle = axisParams.aa;
      this.axisX = axisParams.ax;
      this.axisY = axisParams.ay;

      let vectors = Converter.primirivesToVectors(this.draft.drawing, this.draft.sk);
      this.L = vectors.l;
      this.R = vectors.r;
      this.A = vectors.a;
      this.numberOfParts = this.L.length;

      this.draft.drawing = [];
      this.draft.drawingDots = [];
      this.draft.drawingCollisionMap = null;
      this.selectedAC.index = -1;

      let l = this.L.map((el) => el.value);
      let r = this.R.map((el) => el.value);
      let a = this.A.map((el) => el.value);
      this.draft.l = l;
      this.draft.r = r;
      this.draft.a = a;
      this.draft.makeProfileTransformMatrices(this.axisX, this.axisY, this.axisAngle);
      this.importedProfile = Converter.vectorsToPrimitives(l, r, a, this.axisCenter, this.axisX, this.axisY);
      this.draft.import = this.importedProfile;
      this.draft.collisionMap = this.collisionDetector.buildCollisionMap(this.importedProfile.elements);
      this.draft.firstElementIndex = Math.floor(this.axisCenter) - 1;
      this.draft.calcInfoPositions();
    },
    enableProfileDimensions(event) {
      if (event.target.checked) {
        console.log('checked');
        this.draft.showDimensions = true;
      } else {
        this.draft.showDimensions = false;
      }
    },
    enableProfileNumbering() {
      if (event.target.checked) {
        console.log('checked');
        this.draft.showNumbering = true;
      } else {
        this.draft.showNumbering = false;
      }
    }
  }
}
</script>

<style lang="scss">

  * {
    outline: none;
  }

  html, body {
    margin: 0;
    padding: 0;
    overflow: hidden;
    font-family: 'Montserrat', sans-serif;
  }

  #sidebar {
    display: flex;
    flex-direction: column;
    position: absolute;
    top: 0;
    left: 0;
    padding: 20px;

    & button, label {
      margin-bottom: 10px;
    }
  }

  .btn {
    height: 30px;
    border: none;
    background-color: white;
    font-size: 12px;
    font-family: inherit;
    border-radius: 15px;
    border: 1px solid #c3e3ff;
    transition: background-color 200ms ease;

    &:not(:disabled) {
      cursor: pointer;
      &:hover, &:focus {
        background-color: #c3e3ff;
      }
    }

    &_action {
      background-color: #c3e3ff;
      border: none;

      &:not(:disabled) {
        cursor: pointer;
        &:hover, &:focus {
          background-color: darken(#c3e3ff, 10);
        }
      }
    }
  }

  .number-input {
    width: 50px;
    height: 30px;
    margin: 5px;
    padding: 0 0 0 10px;
    border-radius: 15px;
    border: 1px solid #c3e3ff;
  }

  #overlay {
    display: flex;
    position: absolute;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    justify-content: center;
    align-items: center;
    background-color: rgba(0, 0, 0, 0.5);
  }

  .import-popup {
    max-width: 500px;
    max-height: 90vh;
    overflow-y: scroll;
    padding: 10px;
    background-color: white;
    border-radius: 10px;
    font-size: 12px;
  }

  .button-set {
    display: flex;
    justify-content: center;

    &__button:first-of-type {
      margin-right: 20px;
    }
  }

  .separator {
    height: 1px;
    background-color: #c3e3ff;
    margin: 10px 0;
  }

  #vectors {
    display: flex;
    justify-content: center;
  }

  .vector-group {
    display: inline-flex;
    flex-direction: column;
  }

  .part-params {
    position: absolute;
    top: 10px;
    right: 10px;
    padding: 10px;
    text-align: center;
    border-radius: 10px;
    background-color: white;

    &__btn:first-of-type {
      margin-bottom: 5px;
    }
  }

  #position-bar {
    position: absolute;
    top: calc(50vh - 45px);
    right: 20px;
    width: 40px;
    text-align: center;
  }

  .zoom-btn {
    display: block;
    width: 30px;
    height: 30px;
    border: none;
    background-color: white;
    font-size: 20px;

    &:not(:disabled) {
      cursor: pointer;
      &:hover {
        background-color: #c3e3ff;
      }
    }

    &:disabled {
      background-color: #fafafa;
    }

    &_plus {
      border-radius: 15px 15px 0 0;
      border-bottom: solid 1px #c3e3ff;
    }

    &_minus {
      border-radius: 0 0 15px 15px;
      border-top: solid 1px #c3e3ff;
      margin-bottom: 5px;
      padding-bottom: 5px;
    }
  }

  #current-zoom {
    display: inline-block;
    margin-bottom: 5px;
    padding-right: 8px;
    color: white;
  }

  .checkbox-label {
    display: block;
    width: 30px;
    height: 30px;
    border-radius: 15px;
    padding-top: 3px;
    box-sizing: border-box;
    background-color: white;
    cursor: pointer;

    &:hover {
      background-color: #c3e3ff;
    }

    &__icon {
      width: 25px;
    }
  }

  #enablePan {
    display: none;

    &:checked + label {
      background-color: darken(#c3e3ff, 20);
    }
  }

  .pan-enabled {
    cursor: all-scroll;
  }

  #info-bar {
    position: absolute;
    bottom: 0;
    right: 0;
    padding: 20px;

    & > p {
      font-size: 12px;
      margin: 0;
      color: white;
    }
  }

  .toggle-label {
    display: block;
    text-align: center;
    height: 30px;
    width: auto;
    padding: 5px;
    box-sizing: border-box;
    background-color: white;
    border: 1px solid #c3e3ff;
    font-size: 12px;
    border-radius: 15px;
    cursor: pointer;
    transition: all 200ms ease;
  }


</style>
