
export enum IconType {
	UNKNOWN,

	PERSON,
	MIC,
	MUTED_MIC,
	MOUSE,
	KICK,

	PLUS,
	MINUS,
	VOLUME_X,
	VOLUME_NONE,
	VOLUME_LOW,
	VOLUME_HIGH,

	BOLT,
	HEART,
	ROCKET,
	TRUCK_FAST,
}

export namespace Icon {

	const classMap = new Map<IconType, string>([
		[IconType.PERSON, "fa-user"],
		[IconType.MIC, "fa-microphone"],
		[IconType.MUTED_MIC, "fa-microphone-slash"],
		[IconType.MOUSE, "fa-computer-mouse"],
		[IconType.KICK, "fa-ban"],
		[IconType.PLUS, "fa-plus"],
		[IconType.MINUS, "fa-minus"],
		[IconType.VOLUME_X, "fa-volume-xmark"],
		[IconType.VOLUME_NONE, "fa-volume-off"],
		[IconType.VOLUME_LOW, "fa-volume-low"],
		[IconType.VOLUME_HIGH, "fa-volume-high"],
		[IconType.BOLT, "fa-bolt"],
		[IconType.HEART, "fa-heart"],
		[IconType.ROCKET, "fa-rocket"],
		[IconType.TRUCK_FAST, "fa-truck-fast"],
	]);

	function baseElement() : HTMLElement {
		let html = document.createElement("i");
		html.classList.add("fa-solid");
		return html;
	}

	export function create(type : IconType) : HTMLElement {
		let html = baseElement();
		if (classMap.has(type)) {
			html.classList.add(classMap.get(type));
		}
		return html;
	}
}