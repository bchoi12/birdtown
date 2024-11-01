import { ui } from 'ui'

console.log("Welcome to birdtown!");

document.getElementById("div-loading").style.display = "none";

document.fonts.ready.then(() => {
	document.getElementById("div-screen").style.display = "block";
	ui.setup();
});