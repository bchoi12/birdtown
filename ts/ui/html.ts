

export namespace Html {

	export const canvasGame = "canvas-game";

	export const divLogin = "div-login";
	export const legendLogin = "legend-login";
	export const inputName = "input-name";
	export const inputRoom = "input-room";
	export const loginInfo = "login-info";
	export const formLogin = "form-login";
	export const buttonHost = "button-host";
	export const buttonJoin = "button-join";

	export const divOverlays = "div-overlays";

	export const divStats = "div-stats";

	export const divChat = "div-chat";
	export const divMessage = "div-message";
	export const inputMessage = "input-message";

	export const divMinimap = "div-minimap";
	export const canvasPhysics = "canvas-physics";

	export const divTooltips = "div-tooltips";
	export const divAnnouncement = "div-announcement";
	export const divMainAnnouncement = "div-main-announcement";
	export const divSubAnnouncement = "div-sub-announcement";
	export const divScoreboard = "div-scoreboard";
	export const divDialogs = "div-dialogs"

	export const divPause = "div-pause";
	export const pauseContinue = "pause-continue";
	export const fieldsetClients = "fieldset-clients";

	export const fieldsetSettings = "fieldset-settings";

	export const fieldsetKeyBind = "fieldset-key-bind";

	export const classSlightlyTransparent = "slightly-transparent";
	export const classNoSelect = "no-select";

	export const classTextButton = "text-button";
	export const classKeyBind = "key-bind";
	export const classTooltip = "tooltip";
	export const classTooltipShow = "tooltip-show";

	export const cursor = "cursor";

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

	export function trimmedValue(inputElm : HTMLInputElement) : string {
		return inputElm.value.trim()
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