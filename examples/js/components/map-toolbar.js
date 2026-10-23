import { ColorUtils } from '../color-utils.js';
import { ColorMath } from '../../../dist-js/color-math.js';

export class MapToolbar {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.state = { txtC: 0, txtH: 0, bgC: 0, bgH: 0, sweepMode: 'srgb' };

        this.els = {
            ctrlMode: this.container.querySelector('[data-j0-id="ctrl-mode"]'),
            pickerTxt: this.container.querySelector('[data-j0-id="picker-txt"]'),
            pickerBg: this.container.querySelector('[data-j0-id="picker-bg"]'),
            txt: {
                sliderC: this.container.querySelector('[data-j0-id="slider-txt-c"]'),
                sliderH: this.container.querySelector('[data-j0-id="slider-txt-h"]'),
                valC: this.container.querySelector('[data-j0-id="val-txt-c"]'),
                valH: this.container.querySelector('[data-j0-id="val-txt-h"]')
            },
            bg: {
                sliderC: this.container.querySelector('[data-j0-id="slider-bg-c"]'),
                sliderH: this.container.querySelector('[data-j0-id="slider-bg-h"]'),
                valC: this.container.querySelector('[data-j0-id="val-bg-c"]'),
                valH: this.container.querySelector('[data-j0-id="val-bg-h"]')
            }
        };

        this.bindEvents();
        this.syncFromPicker('txt', '#FBFBFB');
        this.syncFromPicker('bg', '#F2F2F2');
        this.emitState();
    }

    bindEvents() {
        const swapBtn = this.container.querySelector('[data-j0-action="toolbar:swap"]');
        if (swapBtn) {
            swapBtn.addEventListener('click', () => {
                const tmpC = this.state.txtC;
                const tmpH = this.state.txtH;
                this.state.txtC = this.state.bgC;
                this.state.txtH = this.state.bgH;
                this.state.bgC = tmpC;
                this.state.bgH = tmpH;

                if (this.els.txt.sliderC) {
                    this.els.txt.sliderC.value = this.state.txtC;
                    this.els.txt.valC.textContent = this.state.txtC.toFixed(2);
                    this.els.txt.sliderH.value = this.state.txtH;
                    this.els.txt.valH.textContent = this.state.txtH;
                }

                if (this.els.bg.sliderC) {
                    this.els.bg.sliderC.value = this.state.bgC;
                    this.els.bg.valC.textContent = this.state.bgC.toFixed(2);
                    this.els.bg.sliderH.value = this.state.bgH;
                    this.els.bg.valH.textContent = this.state.bgH;
                }

                this.updateSwatches();
                this.emitState();
            });
        }
        const bindInput = (keyC, keyH, axisObj, axisName) => {
            if(!axisObj.sliderC) return;
            axisObj.sliderC.addEventListener('input', (e) => { 
                this.state[keyC] = parseFloat(e.target.value); 
                axisObj.valC.textContent = this.state[keyC].toFixed(2); 
                this.updateSwatches();
                this.emitState();
            });
            axisObj.sliderH.addEventListener('input', (e) => { 
                this.state[keyH] = parseInt(e.target.value, 10); 
                axisObj.valH.textContent = this.state[keyH]; 
                this.updateSwatches();
                this.emitState();
            });
        };

        bindInput('txtC', 'txtH', this.els.txt, 'txt');
        bindInput('bgC', 'bgH', this.els.bg, 'bg');

        if (this.els.pickerTxt) {
            this.els.pickerTxt.addEventListener('input', (e) => {
                this.syncFromPicker('txt', e.target.value);
                this.emitState();
            });
        }

        if (this.els.pickerBg) {
            this.els.pickerBg.addEventListener('input', (e) => {
                this.syncFromPicker('bg', e.target.value);
                this.emitState();
            });
        }

        if (this.els.ctrlMode) {
            this.els.ctrlMode.addEventListener('change', (e) => { 
                this.state.sweepMode = e.target.value; 
                this.emitState(); 
            });
        }
    }

    syncFromPicker(axis, hex) {
        const oklch = ColorMath.hexToOklch(hex);
        if (!oklch) return;
        
        const keyC = axis + 'C';
        const keyH = axis + 'H';
        this.state[keyC] = oklch.c;
        this.state[keyH] = Math.round(oklch.h);
        
        const obj = this.els[axis];
        if(obj.sliderC) {
            obj.sliderC.value = this.state[keyC];
            obj.valC.textContent = this.state[keyC].toFixed(2);
            obj.sliderH.value = this.state[keyH];
            obj.valH.textContent = this.state[keyH];
        }
        this.updateSwatches();
    }

    updateSwatches() {
        if (this.els.pickerTxt) this.els.pickerTxt.value = ColorUtils.oklchToHex(0.6, this.state.txtC, this.state.txtH);
        if (this.els.pickerBg) this.els.pickerBg.value = ColorUtils.oklchToHex(0.6, this.state.bgC, this.state.bgH);
    }

    emitState() {
        if (window.j0 && window.j0.bus) {
            window.j0.bus.emit('map:config-changed', this.state);
        }
    }
}