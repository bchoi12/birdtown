

export namespace Html {

	export const canvasGame = "canvas-game";
	export const divScreen = "div-screen";

	export const divLogin = "div-login";
	export const legendLogin = "legend-login";
	export const inputRoom = "input-room";
	export const loginInfo = "login-info";
	export const loginError = "login-error";
	export const formLogin = "form-login";
	export const divLoginButtons = "div-login-buttons";
	export const buttonHost = "button-host";
	export const buttonJoin = "button-join";

	export const divOverlays = "div-overlays";

	export const divStats = "div-stats";

	export const divChat = "div-chat";
	export const divMessage = "div-message";
	export const inputMessage = "input-message";

	export const divTray = "div-tray";

	export const divMinimap = "div-minimap";
	export const canvasPhysics = "canvas-physics";

	export const divFeed = "div-feed";

	export const divCounters = "div-counters";
	export const divCountersContainer = "div-counters-container";

	export const divStatus = "div-status";

	export const divTooltips = "div-tooltips";
	export const divAnnouncement = "div-announcement";
	export const divMainAnnouncement = "div-main-announcement";
	export const divSubAnnouncement = "div-sub-announcement";
	export const divScoreboard = "div-scoreboard";
	export const divTimer = "div-timer";
	export const divDialogs = "div-dialogs"

	export const divModals = "div-modals";
	export const divMenuDialog = "div-menu-dialog";
	export const divMenu = "div-menu";
	export const menuContinue = "menu-continue";
	export const fieldsetClients = "fieldset-clients";
	export const fieldsetSettings = "fieldset-settings";
	export const fieldsetKeyBind = "fieldset-key-bind";

	export const classSpaced = "spaced";
	export const classNoSelect = "no-select";
	export const classTransparent05 = "transparent-05"
	export const classTransparent07= "transparent-07";

	export const classButton = "button";
	export const classButtonSelect = "button-select";
	export const classButtonSelected = "button-selected";
	export const classColumn = "column";
	export const classColumns = "columns";
	export const classContainer = "container";
	export const classCounter = "counter";
	export const classDialog = "dialog";
	export const classDialogContainer = "dialog-container";
	export const classDialogContent = "dialog-content";
	export const classDialogPage = "dialog-page";
	export const classDialogTitle = "dialog-title";
	export const classFeed = "feed";
	export const classFooter = "footer";
	export const classInfoTable = "info-table";
	export const classLabel = "label";
	export const classLabelName = "label-name";
	export const classLabelValue = "label-value";
	export const classLoadoutButton = "loadout-button";
	export const classLoadoutButtonDescription = "loadout-button-description";
	export const classLoadoutButtonPlus = "loadout-button-plus";
	export const classLoadoutButtonPicture = "loadout-button-picture";
	export const classLoadoutButtonTitle = "loadout-button-title";
	export const classPopup = "popup";
	export const classPopupShow = "popup-show";
	export const classStatusMessage = "status-message";
	export const classTooltip = "tooltip";

	export const cursor = "cursor";
	export const aim = "aim";

	export function elm(id : string) : HTMLElement { return document.getElementById(id); }
	export function canvasElm(id : string) : HTMLCanvasElement { return (<HTMLCanvasElement>document.getElementById(id)); }
	export function inputElm(id : string) : HTMLInputElement { return (<HTMLInputElement>document.getElementById(id)); }

	export function div() : HTMLElement { return document.createElement("div"); }
	export function span() : HTMLElement { return document.createElement("span"); }
	export function br() : HTMLElement { return document.createElement("br"); }
	export function fieldset() : HTMLElement { return document.createElement("fieldset"); }
	export function input() : HTMLInputElement { return <HTMLInputElement>document.createElement("input"); }
	export function label() : HTMLElement { return document.createElement("label"); }
	export function legend() : HTMLElement { return document.createElement("legend"); }
	export function audio() : HTMLAudioElement { return <HTMLAudioElement>document.createElement("audio"); }
	export function button() : HTMLButtonElement { return document.createElement("button"); }
	export function table() : HTMLElement { return document.createElement("table"); }
	export function td() : HTMLElement { return document.createElement("td"); }
	export function th() : HTMLElement { return document.createElement("th"); }
	export function tr() : HTMLElement { return document.createElement("tr"); }
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

export class HtmlWrapper<T extends HTMLElement> {
	private _elm : T;

	constructor(elm : T) {
		this._elm = elm;
	}

	elm() : T { return this._elm; }
	display(display : string) : void { this.elm().style.display = display; }

	removeChildren() : void {
		while (this._elm.firstChild) {
			this._elm.removeChild(this._elm.firstChild);
		}
	}
}