
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
	CANCEL,
	CHECK,
	MINUS,
	PLUS,
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

	// Counters
	BOLT,
	DASH,
	HEART,
	JET,
	ROCKET,
	TELEKENESIS,
}

export namespace Icon {

	const names = new Map<IconType, string>([
		[IconType.BOLT, "bolt"],
		[IconType.CHECK, "check_circle"],
		[IconType.DASH, "sprint"],
		[IconType.HEART, "favorite"],
		[IconType.JET, "flight_takeoff"],
		[IconType.MIC, "mic"],
		[IconType.MINUS, "keyboard_arrow_down"],
		[IconType.MUTED_MIC, "mic_off"],
		[IconType.KICK, "block"],
		[IconType.PERSON_PLUS, "person_add"],
		[IconType.PERSON_SLASH, "person_off"],
		[IconType.PLUS, "keyboard_arrow_up"],
		[IconType.READY, "checklist"],
		[IconType.RESET_SETTINGS, "reset_settings"],
		[IconType.ROCKET, "rocket"],
		[IconType.SHARE, "share"],
		[IconType.SKILLET, "skillet"],
		[IconType.SKULL, "skull"],
		[IconType.TELEKENESIS, "move_selection_right"],
		[IconType.VOLUME_HIGH, "volume_up"],
		[IconType.VOLUME_LOW, "volume_down"],
		[IconType.VOLUME_NONE, "volume_mute"],
		[IconType.VOLUME_X, "no_sound"],
	]);

	function baseElement() : HTMLElement {
		let html = document.createElement("i");
		html.classList.add("material-icons");
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