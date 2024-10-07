
import { Fns, InterpType } from 'util/fns'
import { Timer } from 'util/timer'
import { Vec, Vec3 } from 'util/vector'

export type PanOptions = {
	goal : Vec;
	millis : number;
	interpType? : InterpType;
}

type InterpFn = (t : number) => number;

export class Panner {

	private _base : Vec3;
	private _goal : Vec3;
	private _timer : Timer;
	private _interpFn : InterpFn;

	constructor(vec : Vec) {
		this._base = Vec3.fromVec(vec);
		this._goal = Vec3.fromVec(vec);
		this._timer = new Timer({
			canInterrupt: true,
		});
		this._interpFn = Fns.interpFns.get(InterpType.LINEAR);
	}

	base() : Vec3 { return this._base; }
	goal() : Vec3 { return this._goal; }

	current() : Vec3 {
		const percent = this._timer.percentElapsed();
		if (percent <= 0) { return this._base; }
		if (percent >= 1) { return this._goal; }

		return this._base.interpolateClone(this._goal, percent, this._interpFn);
	}
	update(millis : number) : boolean {
		if (this._timer.hasTimeLeft()) {
			this._timer.elapse(millis);
			return true;
		}
		return false;
	}
	snap() : void { this._timer.finish(); }
	snapTo(goal : Vec3) : void {
		this._goal.copy(goal);
		this.snap();
	}
	pan(options : PanOptions) : void {
		this.panFrom(this.current(), options);
	}
	panFrom(current : Vec3, options : PanOptions) : void {
		this._base.copy(current);
		this._goal.copyVec(options.goal);
		this._timer.start(options.millis);	
		this._interpFn = Fns.interpFns.get(options.interpType ? options.interpType : InterpType.LINEAR);
	}
}