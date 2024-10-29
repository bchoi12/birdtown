
// Number of seconds to do FPS calculation over
const fpsWindow = 5;

// Frame counter
let counter = 0;
// Current frame #
let frame = 0;
// Current FPS for debugging
let current = 60;
// Target FPS and interval
let target = 60;
let interval = Math.floor(1000 / target);

// Last FPS calculation
let lastUpdate = Date.now();

let id = 0;

function tick() {
	const time = Date.now();

	frame++;
	counter++;
	self.postMessage(time);

	const elapsed = time - lastUpdate;
	if (elapsed >= 1000) {
		current = ((fpsWindow - 1) * current + counter) / fpsWindow;
		counter = 0;
		lastUpdate = time;
		id = setTimeout(() => {
			tick();
		}, interval);
		return;
	}
	const framesLeft = target - counter;
	if (framesLeft <= 0) {
		id = setTimeout(() => {
			tick();
		}, interval);
		return;
	}

	id = setTimeout(() => {
		tick();
	}, Math.floor((1000 - elapsed) / framesLeft));
}
tick();

function retick() {
	clearTimeout(id);
	tick();
}

self.onmessage = (event) => {
	switch (event.data) {
	case 1: // slow
		target = 10;
		retick();
		break;
	case 2: // resume
		target = 60;
		retick();
		break;
	}
};