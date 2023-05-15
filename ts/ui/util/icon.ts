export namespace Icon {
	function baseIcon() : HTMLElement {
		let html = document.createElement("i");
		html.classList.add("fa-solid");
		return html;
	}

	function makeIcon(iconClass : string) : HTMLElement {
		let html = baseIcon();
		html.classList.add(iconClass);
		return html;
	}

	// TODO: this can just be map?
	export function person() : HTMLElement { return makeIcon("fa-user"); }
	export function plus() : HTMLElement { return makeIcon("fa-plus"); }
	export function minus() : HTMLElement { return makeIcon("fa-minus"); }
	export function volumeOff() : HTMLElement { return makeIcon("fa-volume-off"); }
	export function volumeLow() : HTMLElement { return makeIcon("fa-volume-low"); }
	export function volumeHigh() : HTMLElement { return makeIcon("fa-volume-high"); }
	export function volumeX() : HTMLElement { return makeIcon("fa-volume-xmark"); }
	export function microphone() : HTMLElement { return makeIcon("fa-microphone"); }
	export function mutedMicrophone() : HTMLElement { return makeIcon("fa-microphone-slash"); }
	export function mouse() : HTMLElement { return makeIcon("fa-computer-mouse"); }
	export function heart() : HTMLElement { return makeIcon("fa-heart"); }
}