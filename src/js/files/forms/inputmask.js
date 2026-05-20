/* Маски для полей (в работе) */

// Подключение функционала "Чертогов Фрилансера"
// Подключение списка активных модулей
import { mhzModules } from "../modules.js";

// Подключение модуля
import "inputmask/dist/inputmask.min.js";

export function inputmaslFirstInit() {
	const inputMasks = document.querySelectorAll('[data-inputmask]');
	if (inputMasks.length) {
    inputMasks.forEach(e=>{
      let definitions = {};
      if (e.hasAttribute('data-only-english')) {
        definitions['*'] = {
          validator: "^[A-Za-z0-9]+$"
        }
      }
      mhzModules.inputmask = Inputmask({
        showMaskOnHover: false,
        definitions
      }).mask(e);
    })
	}
}
inputmaslFirstInit();
