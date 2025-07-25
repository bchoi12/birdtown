

export namespace Html {

	export const canvasGame = "canvas-game";
	export const divScreen = "div-screen";
	export const divSplash = "div-splash";

	export const divLogin = "div-login";
	export const loginLegend = "login-legend";
	export const inputRoom = "input-room";
	export const loginInfo = "login-info";
	export const loginError = "login-error";
	export const divLoginButtons = "login-buttons";
	export const buttonHost = "button-host";
	export const buttonJoin = "button-join";
	export const buttonQuit = "button-quit";

	export const divOverlays = "div-overlays";

	export const divVignette = "div-vignette";

	export const divStats = "div-stats";

	export const divChat = "div-chat";
	export const divMessage = "div-message";
	export const inputMessage = "input-message";

	export const divTray = "div-tray";

	export const divMinimap = "div-minimap";
	export const canvasPhysics = "canvas-physics";

	export const divFeed = "div-feed";

	export const divCounters = "div-counters";
	export const divCountersContainer = "counters-container";

	export const divStatus = "div-status";

	export const divHud = "div-hud";
	export const divHudSections = "hud-sections";
	export const divHudLeft = "hud-left";
	export const divHudCenter = "hud-center";
	export const divHudRight = "hud-right";
	export const divHudName = "hud-name";

	export const divTooltips = "div-tooltips";
	export const divAnnouncement = "div-announcement";
	export const divMainAnnouncement = "div-main-announcement";
	export const divSubAnnouncement = "div-sub-announcement";
	export const divGameInfo = "div-game-info";
	export const divScoreboard = "div-scoreboard";
	export const divTimer = "div-timer";
	export const divDialogs = "div-dialogs"

	export const divModals = "div-modals";
	export const divMenu = "div-menu";
	export const menuContinue = "menu-continue";
	export const menuQuit = "menu-quit";
	export const fieldsetClients = "fieldset-clients";
	export const fieldsetSettings = "fieldset-settings";
	export const fieldsetKeyBind = "fieldset-key-bind";

	export const divLoading = "div-loading";

	export const classSpaced = "spaced";
	export const classNoSelect = "no-select";
	export const classTransparent05 = "transparent-05"
	export const classTransparent08= "transparent-08";

	export const classBirdPhoto = "bird-photo";
	export const classBirdPicker = "bird-picker";
	export const classButton = "button";
	export const classButtonGray = "button-gray";
	export const classButtonInverted = "button-inverted";
	export const classButtonSelect = "button-select";
	export const classButtonSelected = "button-selected";
	export const classCategory = "category";
	export const classCategoryTitle = "category-title";
	export const classCategoryTitleExpandable = "category-title-expandable";
	export const classCategoryContent = "category-content";
	export const classColorBlock = "color-block";
	export const classColorPick = "color-pick";
	export const classColorSelected = "color-selected";
	export const classColumn = "column";
	export const classColumns = "columns";
	export const classContainer = "container";
	export const classCounter = "counter";
	export const classDialog = "dialog";
	export const classDialogContainer = "dialog-container";
	export const classDialogContent = "dialog-content";
	export const classDialogHide = "dialog-hide";
	export const classDialogImportant = "dialog-important";
	export const classDialogOpaque = "dialog-opaque";
	export const classDialogPage = "dialog-page";
	export const classDialogSmall = "dialog-small";
	export const classDialogTitle = "dialog-title";
	export const classDisplayName = "display-name";
	export const classEquipSelect = "equip-select";
	export const classEquipSelectInvalid = "equip-select-invalid";
	export const classFeed = "feed";
	export const classFooter = "footer";
	export const classHighlight = "highlight";
	export const classHudBlock = "hud-block";
	export const classHudBlockCharging = "hud-block-charging";
	export const classHudContainer = "hud-container";
	export const classHudContainerCharging = "hud-container-charging";
	export const classHudText = "hud-text";
	export const classHudKey = "hud-key";
	export const classInfo = "info";
	export const classInfoMain = "info-main";
	export const classInfoSecondary = "info-secondary";
	export const classInfoBlock = "info-block";
	export const classLabel = "label";
	export const classLabelInput = "label-input";
	export const classLabelName = "label-name";
	export const classLabelValue = "label-value";
	export const classLoadoutButton = "loadout-button";
	export const classLoadoutButtonDescription = "loadout-button-description";
	export const classLoadoutButtonIcon = "loadout-button-icon";
	export const classLoadoutButtonPlus = "loadout-button-plus";
	export const classLoadoutButtonPicture = "loadout-button-picture";
	export const classLoadoutButtonTags = "loadout-button-tags";
	export const classLoadoutButtonTitle = "loadout-button-title";
	export const classModeSelect = "mode-select";
	export const classModeSelectInvalid = "mode-select-invalid";
	export const classOnscreenMessage = "onscreen-message";
	export const classPopup = "popup";
	export const classPopupShow = "popup-show";
	export const classProgress = "progress";
	export const classScoreboardContainer = "scoreboard-container";
	export const classScoreboardTitle = "scoreboard-title";
	export const classServerInfo = "server-info";
	export const classStat = "stat";
	export const classStatusMessage = "status-message";
	export const classTable = "table";
	export const classTableRowSelect = "table-row-select";
	export const classTooltip = "tooltip";

	export const cursor = "cursor";
	export const aim = "aim";

	export function elm(id : string) : HTMLElement { return document.getElementById(id); }
	export function canvasElm(id : string) : HTMLCanvasElement { return (<HTMLCanvasElement>document.getElementById(id)); }
	export function inputElm(id : string) : HTMLInputElement { return (<HTMLInputElement>document.getElementById(id)); }

	export function div() : HTMLElement { return document.createElement("div"); }
	export function span() : HTMLElement { return document.createElement("span"); }
	export function br() : HTMLElement { return document.createElement("br"); }
	export function img() : HTMLImageElement { return document.createElement("img"); }
	export function fieldset() : HTMLElement { return document.createElement("fieldset"); }
	export function form() : HTMLFormElement { return <HTMLFormElement>document.createElement("form"); }
	export function kbd() : HTMLElement { return document.createElement("kbd"); }
	export function label() : HTMLElement { return document.createElement("label"); }
	export function legend() : HTMLElement { return document.createElement("legend"); }
	export function table() : HTMLTableElement { return <HTMLTableElement>document.createElement("table"); }
	export function td() : HTMLTableCellElement { return <HTMLTableCellElement>document.createElement("td"); }
	export function th() : HTMLTableCellElement { return <HTMLTableCellElement>document.createElement("th"); }
	export function tr() : HTMLTableRowElement { return <HTMLTableRowElement>document.createElement("tr"); }
	export function icon() : HTMLElement { return document.createElement("i"); }
	export function audio() : HTMLAudioElement { return <HTMLAudioElement>document.createElement("audio"); }
	export function button() : HTMLButtonElement { return document.createElement("button"); }
	export function input() : HTMLInputElement { return <HTMLInputElement>document.createElement("input"); }
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

	export function hasOverflowY(elm : HTMLElement) : boolean {
		return elm.scrollHeight > elm.clientHeight;
	}
}

export class HtmlWrapper<T extends HTMLElement> {
	private _elm : T;

	constructor(elm : T) {
		this._elm = elm;
	}

	elm() : T { return this._elm; }
	display(display : string) : void { this.elm().style.display = display; }
	hasOverflowY() : boolean { return Html.hasOverflowY(this._elm); }

	removeChildren() : void {
		while (this._elm.firstChild) {
			this._elm.removeChild(this._elm.firstChild);
		}
	}
}