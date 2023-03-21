export namespace Icon {
	function baseIcon() : HTMLElement {
		let html = document.createElement("i");
		html.classList.add("fa-solid");
		return html;
	}

	export function person() : HTMLElement {
		let html = baseIcon();
		html.classList.add("fa-user");
		return html;
	}

	export function plus() : HTMLElement {
		let html = baseIcon();
		html.classList.add("fa-plus");
		return html;
	}

	export function minus() : HTMLElement {
		let html = baseIcon();
		html.classList.add("fa-minus");
		return html;
	}

	export function volumeOff() : HTMLElement {
		let html = baseIcon();
		html.classList.add("fa-volume-off");
		return html;
	}

	export function volumeLow() : HTMLElement {
		let html = baseIcon();
		html.classList.add("fa-volume-low");
		return html;
	}

	export function volumeHigh() : HTMLElement {
		let html = baseIcon();
		html.classList.add("fa-volume-high");
		return html;
	}

	export function volumeX() : HTMLElement {
		let html = baseIcon();
		html.classList.add("fa-volume-xmark");
		return html;
	}

	export function microphone() : HTMLElement {
		let html = baseIcon();
		html.classList.add("fa-microphone");
		return html;
	}

	export function mutedMicrophone() : HTMLElement {
		let html = baseIcon();
		html.classList.add("fa-microphone-slash");
		return html;
	}

	export function mouse() : HTMLElement {
		let html = baseIcon();
		html.classList.add("fa-computer-mouse");
		return html;
	}
}