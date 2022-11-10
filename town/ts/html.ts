

export namespace Html {

	export const canvasGame = "canvas-game";

	export function elm(id : string) : HTMLElement { return document.getElementById(id); }
	export function canvasElm(id : string) : HTMLCanvasElement { return (<HTMLCanvasElement>document.getElementById(id)); }
	export function inputElm(id : string) : HTMLInputElement { return (<HTMLInputElement>document.getElementById(id)); }

	export function div() : HTMLElement { return document.createElement("div"); }
	export function span() : HTMLElement { return document.createElement("span"); }
	export function br() : HTMLElement { return document.createElement("br"); }
	export function input() : HTMLInputElement { return <HTMLInputElement>document.createElement("input"); }
	export function label() : HTMLElement { return document.createElement("label"); }
	export function audio() : HTMLAudioElement { return <HTMLAudioElement>document.createElement("audio"); }
	export function button() : HTMLElement { return document.createElement("button"); }
	export function icon() : HTMLElement { return document.createElement("i"); }
	export function range() : HTMLInputElement {
		let range = <HTMLInputElement>document.createElement("input");
		range.type = "range";
		return range;
	}
	export function divider(borderStyle : string) : HTMLElement {
		let hr = document.createElement("hr");
		hr.style.borderTop = borderStyle;
		return hr;
	}
}

export class HtmlWrapper {
	private _elm : HTMLElement;

	constructor(elm : HTMLElement) {
		this._elm = elm;
	}

	elm() : HTMLElement { return this._elm; }

	removeChildren() : void {
		while (this._elm.firstChild) {
			this._elm.removeChild(this._elm.firstChild);
		}
	}
}