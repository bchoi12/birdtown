import { ui } from 'ui'

const time = Date.now();
document.fonts.ready.then(() => {
	console.log("Welcome to birdtown!");
	setTimeout(() => {
		document.getElementById("div-initializing").style.display = "none";
		document.getElementById("div-screen").style.display = "block";
		ui.setup();
	}, Math.max(1, 500 - (Date.now() - time)));
});