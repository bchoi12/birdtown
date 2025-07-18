
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
	CHECK_CIRCLE,
	COPY,
	DICE,
	HOST,
	INFINITY,
	LOW_SPEC,
	LOWEST_SPEC,
	MENU_OPEN,
	MINUS,
	MOUSE,
	PLUS,
	REFRESH,
	REROLL,
	RESET_GRAPHICS,
	RESET_SETTINGS,
	SHARE,
	TIMER,
	VOLUME_X,
	VOLUME_NONE,
	VOLUME_LOW,
	VOLUME_HIGH,

	// UI
	ERROR,
	NETWORK_SIGNAL,
	ONE_MORE,
	PENDING,
	READY,
	RENDER,
	SIGN,
	SKILLET,
	SKULL,
	TROPHY,
	UPDATE,

	// HUD
	BACKFLIP,
	BATTERY_ERROR,
	BATTERY_FULL,
	BIRD,
	BOLT,
	DASH,
	GATLING,
	HEADPHONES,
	HEART,
	JET,
	LINE,
	LOCK,
	MINIGUN,
	MONEY,
	MUSIC_NOTE,
	ROCKET,
	ROCKET_LAUNCH,
	ROCKING_HORSE,
	ROLL,
	TELEKENESIS,
	TORNADO,
	UNLOCK,
	ORBS,
	SNOW,
	SPRAY,
	STAR,
	SWORDS,
	WARNING,
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
		[IconType.CHECK, "check"],
		[IconType.CHECK_CIRCLE, "check_circle"],
		[IconType.COPY, "content_copy"],
		[IconType.DASH, "sprint"],
		[IconType.DICE, "ifl"],
		[IconType.ERROR, "error"],
		[IconType.GATLING, "clear_all"],
		[IconType.HEADPHONES, "headphones"],
		[IconType.HEART, "favorite"],
		[IconType.HOST, "home"],
		[IconType.INFINITY, "all_inclusive"],
		[IconType.JET, "flight_takeoff"],
		[IconType.LOCK, "lock"],
		[IconType.MENU_OPEN, "menu_open"],
		[IconType.MIC, "mic"],
		[IconType.MINIGUN, "sort"],
		[IconType.MINUS, "remove"],
		[IconType.MOUSE, "mouse"],
		[IconType.MUSIC_NOTE, "music_note"],
		[IconType.MUTED_MIC, "mic_off"],
		[IconType.KICK, "block"],
		[IconType.LINE, "remove"],
		[IconType.LOW_SPEC, "keyboard_arrow_down"],
		[IconType.LOWEST_SPEC, "keyboard_double_arrow_down"],
		[IconType.MONEY, "local_atm"],
		[IconType.NETWORK_SIGNAL, "signal_cellular_alt"],
		[IconType.ONE_MORE, "counter_1"],
		[IconType.ORBS, "scatter_plot"],
		[IconType.PENDING, "pending"],
		[IconType.PERSON, "person"],
		[IconType.PERSON_PLUS, "person_add"],
		[IconType.PERSON_SLASH, "person_off"],
		[IconType.PLUS, "add"],
		[IconType.READY, "checklist"],
		[IconType.REFRESH, "refresh"],
		[IconType.RENDER, "filter"],
		[IconType.REROLL, "playing_cards"],
		[IconType.RESET_GRAPHICS, "reset_focus"],
		[IconType.RESET_SETTINGS, "reset_settings"],
		[IconType.ROCKET, "rocket"],
		[IconType.ROCKET_LAUNCH, "rocket_launch"],
		[IconType.ROCKING_HORSE, "bedroom_baby"],
		[IconType.ROLL, "cached"],
		[IconType.SHARE, "share"],
		[IconType.SIGN, "signpost"],
		[IconType.SKILLET, "skillet"],
		[IconType.SKULL, "skull"],
		[IconType.SPRAY, "sprinkler"],
		[IconType.SNOW, "snowing"],
		[IconType.STAR, "star"],
		[IconType.SWORDS, "swords"],
		[IconType.TELEKENESIS, "move_selection_right"],
		[IconType.TIMER, "timer"],
		[IconType.TORNADO, "tornado"],
		[IconType.TROPHY, "trophy"],
		[IconType.UNLOCK, "lock_open_right"],
		[IconType.UPDATE, "update"],
		[IconType.VOLUME_HIGH, "volume_up"],
		[IconType.VOLUME_LOW, "volume_down"],
		[IconType.VOLUME_NONE, "volume_mute"],
		[IconType.VOLUME_X, "no_sound"],
		[IconType.WARNING, "warning"],
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
		if (type === IconType.UNKNOWN) {
			return clear(elm);
		}

		if (names.has(type)) {
			elm.innerHTML = names.get(type);
		} else {
			console.error("Error: missing mapping for icon type %s", IconType[type]);
		}
		return elm;
	}
	export function clear(elm : HTMLElement) : HTMLElement {
		elm.innerHTML = "";
		return elm;
	}

	const entityIcons = new Map<EntityType, IconType>([
		[EntityType.BAZOOKA, IconType.ROCKET],
		[EntityType.GATLING, IconType.GATLING],
		[EntityType.GOLDEN_GUN, IconType.MONEY],
		[EntityType.MINIGUN, IconType.MINIGUN],
		[EntityType.ORB_CANNON, IconType.SNOW],
		[EntityType.PISTOL, IconType.ROCKING_HORSE],
		[EntityType.PURPLE_GLOVE, IconType.STAR],
		[EntityType.RED_GLOVE, IconType.SWORDS],
		[EntityType.RIFLE, IconType.LINE],
		[EntityType.SHOTGUN, IconType.SPRAY],
		[EntityType.SNIPER, IconType.BOLT],
		[EntityType.WING_CANNON, IconType.ORBS],

		[EntityType.BOOSTER, IconType.ROCKET_LAUNCH],
		[EntityType.BLACK_HEADBAND, IconType.TORNADO],
		[EntityType.COWBOY_HAT, IconType.ROLL],
		[EntityType.HEADPHONES, IconType.HEADPHONES],
		[EntityType.JETPACK, IconType.JET],
		[EntityType.POCKET_ROCKET, IconType.ROCKET],
		[EntityType.PURPLE_HEADBAND, IconType.DASH],
		[EntityType.RED_HEADBAND, IconType.BACKFLIP],
		[EntityType.SCOUTER, IconType.BATTERY_FULL],
		[EntityType.TOP_HAT, IconType.ROLL],
	]);

	export function getEntityIconType(type : EntityType) : IconType {
		if (!entityIcons.has(type)) {
			console.error("Error: no icon type for %s", EntityType[type]);
			return IconType.UNKNOWN;
		}

		return entityIcons.get(type);
	}
}