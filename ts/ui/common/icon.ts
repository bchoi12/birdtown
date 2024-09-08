
import { EntityType } from 'game/entity/api'

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
	COPY,
	DICE,
	INFINITY,
	MENU_OPEN,
	MOUSE,
	RESET_SETTINGS,
	SHARE,
	TIMER,
	VOLUME_X,
	VOLUME_NONE,
	VOLUME_LOW,
	VOLUME_HIGH,

	// Feed
	READY,
	SKILLET,
	SKULL,
	TROPHY,

	// HUD
	BOLT,
	DASH,
	EARTH,
	GATLING,
	HEART,
	JET,
	MUSIC_NOTE,
	ROCKET,
	ROCKING_HORSE,
	ROLL,
	TELEKENESIS,
	SPRAY,
	STAR,
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
		[IconType.COPY, "content_copy"],
		[IconType.DASH, "sprint"],
		[IconType.DICE, "ifl"],
		[IconType.EARTH, "public"],
		[IconType.GATLING, "clear_all"],
		[IconType.HEART, "favorite"],
		[IconType.INFINITY, "all_inclusive"],
		[IconType.JET, "flight_takeoff"],
		[IconType.MENU_OPEN, "menu_open"],
		[IconType.MIC, "mic"],
		[IconType.MOUSE, "mouse"],
		[IconType.MUSIC_NOTE, "music_note"],
		[IconType.MUTED_MIC, "mic_off"],
		[IconType.KICK, "block"],
		[IconType.PERSON_PLUS, "person_add"],
		[IconType.PERSON_SLASH, "person_off"],
		[IconType.READY, "checklist"],
		[IconType.RESET_SETTINGS, "reset_settings"],
		[IconType.ROCKET, "rocket"],
		[IconType.ROCKING_HORSE, "bedroom_baby"],
		[IconType.ROLL, "cached"],
		[IconType.SHARE, "share"],
		[IconType.SKILLET, "skillet"],
		[IconType.SKULL, "skull"],
		[IconType.SPRAY, "household_supplies"],
		[IconType.STAR, "star"],
		[IconType.TELEKENESIS, "move_selection_right"],
		[IconType.TIMER, "timer"],
		[IconType.TROPHY, "trophy"],
		[IconType.VOLUME_HIGH, "volume_up"],
		[IconType.VOLUME_LOW, "volume_down"],
		[IconType.VOLUME_NONE, "volume_mute"],
		[IconType.VOLUME_X, "no_sound"],
	]);

	export function baseElement() : HTMLElement {
		let html = Html.icon();
		html.classList.add("material-icons");
		html.classList.add(Html.classNoSelect);
		return html;
	}

	export function create(type : IconType) : HTMLElement {
		return change(baseElement(), type);
	}

	export function change(elm : HTMLElement, type : IconType) : HTMLElement {
		if (names.has(type)) {
			elm.innerHTML = names.get(type);
		} else {
			console.error("Error: missing mapping for icon type %s", IconType[type]);
		}
		return elm;
	}

	const entityIcons = new Map<EntityType, IconType>([
		[EntityType.BAZOOKA, IconType.ROCKET],
		[EntityType.CLAW, IconType.DASH],
		[EntityType.GATLING, IconType.GATLING],
		[EntityType.PISTOL, IconType.ROCKING_HORSE],
		[EntityType.SHOTGUN, IconType.SPRAY],
		[EntityType.SNIPER, IconType.BOLT],
	]);

	export function getEntityIconType(type : EntityType) : IconType {
		if (!entityIcons.has(type)) {
			console.error("Error: no icon type for %s", EntityType[type]);
			return IconType.UNKNOWN;
		}

		return entityIcons.get(type);
	}
}