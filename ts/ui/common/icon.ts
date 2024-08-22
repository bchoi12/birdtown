
import { Html } from 'ui/html'

// TODO: move to api class?
export enum IconType {
	UNKNOWN,

	// Player related
	KICK,
	MIC,
	MUTED_MIC,
	PERSON_PLUS,
	PERSON_SLASH,

	// Menu
	ARROW_DOWN,
	ARROW_LEFT,
	ARROW_RIGHT,
	ARROW_UP,
	CANCEL,
	CHECK,
	DICE,
	INFINITY,
	MENU_OPEN,
	RESET_SETTINGS,
	SHARE,
	VOLUME_X,
	VOLUME_NONE,
	VOLUME_LOW,
	VOLUME_HIGH,

	// Feed
	READY,
	SKILLET,
	SKULL,
	TROPHY,

	// Counters
	BOLT,
	DASH,
	GATLING,
	HEART,
	JET,
	ROCKET,
	TELEKENESIS,
}

export namespace Icon {

	const names = new Map<IconType, string>([
		[IconType.ARROW_DOWN, "keyboard_arrow_down"],
		[IconType.ARROW_LEFT, "keyboard_arrow_left"],
		[IconType.ARROW_RIGHT, "keyboard_arrow_right"],
		[IconType.ARROW_UP, "keyboard_arrow_up"],
		[IconType.BOLT, "bolt"],
		[IconType.CANCEL, "cancel"],
		[IconType.CHECK, "check_circle"],
		[IconType.DASH, "sprint"],
		[IconType.DICE, "ifl"],
		[IconType.GATLING, "clear_all"],
		[IconType.HEART, "favorite"],
		[IconType.INFINITY, "all_inclusive"],
		[IconType.JET, "flight_takeoff"],
		[IconType.MENU_OPEN, "menu_open"],
		[IconType.MIC, "mic"],
		[IconType.MUTED_MIC, "mic_off"],
		[IconType.KICK, "block"],
		[IconType.PERSON_PLUS, "person_add"],
		[IconType.PERSON_SLASH, "person_off"],
		[IconType.READY, "checklist"],
		[IconType.RESET_SETTINGS, "reset_settings"],
		[IconType.ROCKET, "rocket"],
		[IconType.SHARE, "share"],
		[IconType.SKILLET, "skillet"],
		[IconType.SKULL, "skull"],
		[IconType.TELEKENESIS, "move_selection_right"],
		[IconType.TROPHY, "trophy"],
		[IconType.VOLUME_HIGH, "volume_up"],
		[IconType.VOLUME_LOW, "volume_down"],
		[IconType.VOLUME_NONE, "volume_mute"],
		[IconType.VOLUME_X, "no_sound"],
	]);

	function baseElement() : HTMLElement {
		let html = Html.icon();
		html.classList.add("material-icons");
		html.classList.add(Html.classNoSelect);
		return html;
	}

	export function create(type : IconType) : HTMLElement {
		let html = baseElement();
		if (names.has(type)) {
			html.innerHTML = names.get(type);
		} else {
			console.error("Error: missing mapping for icon type %s", IconType[type]);
		}
		return html;
	}
}