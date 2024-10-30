
// Number of seconds to do FPS calculation over
const averageWindow = 10;

// Current frame #
let frame = 0;
// Current interval
let current = 0;
// Target interval
let target = 0;

// Last tick
let lastTick = Date.now();

let id = 0;

function tick() {
	const time = Date.now();

	frame++;
	self.postMessage(time);

	const elapsed = time - lastTick;
	current = Math.max(1, ((averageWindow - 1) * current + elapsed) / averageWindow);
	lastTick = Date.now();

	const interval = Math.max(1, Math.min(target, target * target / current));
	id = setTimeout(() => {
		tick();
	}, Math.round(interval));
}
startTick(60);

function startTick(fps) {
	clearTimeout(id);
	target = 1000 / fps;
	current = target;
	tick();
}

self.onmessage = (event) => {
	switch (event.data) {
	case 1: // slow
		startTick(10);
		break;
	case 2: // resume
		startTick(60);
		break;
	}
};