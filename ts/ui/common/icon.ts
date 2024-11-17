
import { EntityType } from 'game/entity/api'

import { Html } from 'ui/html'

// TODO: move to api class?
export enum IconType {
	UNKNOWN,

	// Player related
	KICK,
	MIC,
	MUTED_MIC,
	PERSON,
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
	REROLL,
	RESET_SETTINGS,
	SHARE,
	TIMER,
	VOLUME_X,
	VOLUME_NONE,
	VOLUME_LOW,
	VOLUME_HIGH,

	// Feed
	READY,
	SIGN,
	SKILLET,
	SKULL,
	TROPHY,

	// HUD
	BACKFLIP,
	BATTERY_ERROR,
	BATTERY_FULL,
	BIRD,
	BOLT,
	DASH,
	EARTH,
	GATLING,
	HEART,
	JET,
	LOCK,
	MUSIC_NOTE,
	ROBOT,
	ROCKET,
	ROCKET_LAUNCH,
	ROCKING_HORSE,
	ROLL,
	TELEKENESIS,
	UNLOCK,
	SPRAY,
	STAR,
	SWORDS,
}

export namespace Icon {

	const names = new Map<IconType, string>([
		[IconType.ARROW_DOWN, "keyboard_arrow_down"],
		[IconType.ARROW_LEFT, "keyboard_arrow_left"],
		[IconType.ARROW_RIGHT, "keyboard_arrow_right"],
		[IconType.ARROW_UP, "keyboard_arrow_up"],
		[IconType.BACKFLIP, "replay"],
		[IconType.BATTERY_ERROR, "battery_error"],
		[IconType.BATTERY_FULL, "battery_full"],
		[IconType.BIRD, "raven"],
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
		[IconType.LOCK, "lock"],
		[IconType.MENU_OPEN, "menu_open"],
		[IconType.MIC, "mic"],
		[IconType.MOUSE, "mouse"],
		[IconType.MUSIC_NOTE, "music_note"],
		[IconType.MUTED_MIC, "mic_off"],
		[IconType.KICK, "block"],
		[IconType.PERSON, "person"],
		[IconType.PERSON_PLUS, "person_add"],
		[IconType.PERSON_SLASH, "person_off"],
		[IconType.READY, "checklist"],
		[IconType.REROLL, "cached"],
		[IconType.RESET_SETTINGS, "reset_settings"],
		[IconType.ROBOT, "robot"],
		[IconType.ROCKET, "rocket"],
		[IconType.ROCKET_LAUNCH, "rocket_launch"],
		[IconType.ROCKING_HORSE, "bedroom_baby"],
		[IconType.ROLL, "cached"],
		[IconType.SHARE, "share"],
		[IconType.SIGN, "signpost"],
		[IconType.SKILLET, "skillet"],
		[IconType.SKULL, "skull"],
		[IconType.SPRAY, "household_supplies"],
		[IconType.STAR, "star"],
		[IconType.SWORDS, "swords"],
		[IconType.TELEKENESIS, "move_selection_right"],
		[IconType.TIMER, "timer"],
		[IconType.TROPHY, "trophy"],
		[IconType.UNLOCK, "lock_open_right"],
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

	export function string(type : IconType) : string {
		return create(type).outerHTML;
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
		[EntityType.GATLING, IconType.GATLING],
		[EntityType.PISTOL, IconType.ROCKING_HORSE],
		[EntityType.PURPLE_GLOVE, IconType.STAR],
		[EntityType.RED_GLOVE, IconType.SWORDS],
		[EntityType.SHOTGUN, IconType.SPRAY],
		[EntityType.SNIPER, IconType.BOLT],
		[EntityType.WING_CANNON, IconType.ROBOT],
	]);

	export function getEntityIconType(type : EntityType) : IconType {
		if (!entityIcons.has(type)) {
			console.error("Error: no icon type for %s", EntityType[type]);
			return IconType.UNKNOWN;
		}

		return entityIcons.get(type);
	}
}