
export enum IconType {
	UNKNOWN,

	// Player related
	JOIN,
	KICK,
	MIC,
	MUTED_MIC,
	MOUSE,
	PERSON,
	PERSON_SLASH,

	// Menu
	PLUS,
	MINUS,
	VOLUME_X,
	VOLUME_NONE,
	VOLUME_LOW,
	VOLUME_HIGH,
	SHARE,

	// Feed
	GUN,
	SKULL,

	// Counters
	BOLT,
	DASH,
	HEART,
	JET,
	ROCKET,
	TRUCK_FAST,
}

export namespace Icon {

	const classMap = new Map<IconType, string>([
		[IconType.BOLT, "fa-bolt"],
		[IconType.DASH, "fa-person-running"],
		[IconType.GUN, "fa-gun"],
		[IconType.HEART, "fa-heart"],
		[IconType.JET, "fa-jet-fighter-up"],
		[IconType.JOIN, "fa-right-to-bracket"],
		[IconType.MIC, "fa-microphone"],
		[IconType.MINUS, "fa-minus"],
		[IconType.MUTED_MIC, "fa-microphone-slash"],
		[IconType.MOUSE, "fa-computer-mouse"],
		[IconType.KICK, "fa-ban"],
		[IconType.PERSON, "fa-user"],
		[IconType.PERSON_SLASH, "fa-user-slash"],
		[IconType.PLUS, "fa-plus"],
		[IconType.ROCKET, "fa-rocket"],
		[IconType.SHARE, "fa-share-nodes"],
		[IconType.SKULL, "fa-skull"],
		[IconType.TRUCK_FAST, "fa-truck-fast"],
		[IconType.VOLUME_HIGH, "fa-volume-high"],
		[IconType.VOLUME_LOW, "fa-volume-low"],
		[IconType.VOLUME_NONE, "fa-volume-off"],
		[IconType.VOLUME_X, "fa-volume-xmark"],
	]);

	function baseElement() : HTMLElement {
		let html = document.createElement("i");
		html.classList.add("fa-solid");
		return html;
	}

	export function create(type : IconType) : HTMLElement {
		/*
		if (type === IconType.HEART) {
			let html = document.createElement("i");
			html.classList.add("material-icons");
			html.innerHTML = "favorite";
			return html;
		}
		*/

		let html = baseElement();
		if (classMap.has(type)) {
			html.classList.add(classMap.get(type));
		}
		return html;
	}
}