
import { System, SystemBase, SystemType } from 'game/system'

import { Data } from 'network/data'

export abstract class GameModeBase extends SystemBase implements System {

	protected _active : boolean;

	constructor(type : SystemType) {
		super(type);

		this.addProp<boolean>({
			export: () => { return this._active; },
			import: (obj : boolean) => { this._active = obj; },
			options: {
				filters: Data.tcpFilters,
			},
		})
		this.addProp<number>({
			export: () => { return this.state(); },
			import: (obj : number) => { this.setState(obj); },
			options: {
				filters: Data.tcpFilters,
			},
		})
	}

	active() : boolean { return this._active; }
	setActive(active : boolean) { this._active = active; }

	abstract state() : number;
	abstract setState(state : number) : void;
}