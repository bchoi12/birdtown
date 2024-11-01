
// Number of seconds to do FPS calculation over
const averageWindow = 10;

// Current frame #
let frame = 0;

// Requested interval
let interval = 0;
// Actual interval
let actual = 0;
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
	actual = Math.max(1, ((averageWindow - 1) * actual + elapsed) / averageWindow);
	lastTick = Date.now();

	const diff = target - actual;
	if (diff < -1) {
		// Running slow
		interval -= 0.2;
	} else if (diff > 1) {
		// Too fast
		interval += 0.2;
	}
	interval = Math.max(1, Math.min(target, interval));
	id = setTimeout(() => {
		tick();
	}, Math.round(interval));
}

function startTick(fps) {
	target = 1000 / fps;
	interval = target;
	actual = target;
	diff = 0;
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
startTick(60);