
import { Entity } from 'game/entity'
import { SpacedId } from 'game/spaced_id'

interface Coord {
	x : number;
	y : number;
}

interface GridOptions {
	unitWidth : number;
	unitHeight : number;
}

export class Grid {

	private readonly _unitWidth : number;
	private readonly _unitHeight : number;

	constructor(options : GridOptions) {
		this._unitWidth = options.unitWidth;
		this._unitHeight = options.unitHeight;
	}

	update(ts : number) : void {
		
	}

	upsert(entity : Entity) : void {

	}

	get(sid : SpacedId) : Entity {
		return null;
	}

	delete(sid : SpacedId) : void {

	}
}