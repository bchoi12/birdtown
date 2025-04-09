
import { ui } from 'ui'
import { Flags } from 'global/flags'

const time = Date.now();
document.fonts.ready.then(() => {
	console.log("Welcome to birdtown!");

	const [ok, error] = Flags.validate();
	if (!ok) {
		console.error(error);
	}

	setTimeout(() => {
		document.getElementById("div-initializing").style.display = "none";
		document.getElementById("div-screen").style.display = "block";
		ui.setup();
	}, Math.max(1, 500 - (Date.now() - time)));
});