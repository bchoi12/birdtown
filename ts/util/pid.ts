

// TODO: finish this
export class PID {

	private _p : number;
	private _i : number;
	private _d : number;

	private _previousError : number;
	private _integralError : number;

	constructor() {

	}

	update(millis : number, current : number, desired : number) : number {
		return 0;
	}
}