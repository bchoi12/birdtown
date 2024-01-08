

export class SavedCounter {

	private _count : number;
	private _saved : number;

	constructor(value? : number) {
		this._count = value ? value : 0;
		this._saved = value ? value : 0;
	}

	count() : number { return this._count; }
	saved() : number { return this._saved; }
	diff() : number { return this._count - this._saved; }

	reset() : void { this._count = 0; }
	resetSaved() : void { this._saved = 0; }

	set(value : number) : void { this._count = value; }
	add(value : number) : void { this._count += value; }

	save() : number {
		const diff = this.diff();
		this._saved = this._count;
		return diff;
	}
}