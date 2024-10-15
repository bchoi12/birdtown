
import { PlayerConfig, PlayerInfo, StartRole } from 'game/util/player_config'

import { SeededRandom } from 'util/seeded_random'

export class PlayerRotator {

	private static readonly _trackedRoles = new Set<StartRole>([StartRole.NO_TEAM, StartRole.TEAM_ONE, StartRole.TEAM_TWO]);

	private _index : number;
	private _dir : number;
	private _ids : Array<number>;
	private _rng : SeededRandom;

	constructor() {
		this._index = -1;
		this._dir = 1;
		this._ids = new Array();
		this._rng = new SeededRandom(Math.floor(1000 * Math.random()));
	}

	updateShuffled(config : PlayerConfig) : void {
		let idMap = new Map<StartRole, Array<number>>();
		config.playerMap().forEach((info : PlayerInfo, id : number) => {
			if (PlayerRotator._trackedRoles.has(info.role)) {
				if (!idMap.has(info.role)) {
					idMap.set(info.role, new Array());
				}

				idMap.get(info.role).push(id);
			}
		});

		idMap.forEach((ids : Array<number>) => {
			this._rng.shuffle(ids);
		});

		this._ids = new Array();
		if (idMap.has(StartRole.NO_TEAM)) {
			this._ids = this._ids.concat(idMap.get(StartRole.NO_TEAM));
		}

		this._ids = this._ids.concat(this.weave([StartRole.TEAM_ONE, StartRole.TEAM_TWO], idMap));
		this._index = -1;
	}

	private weave(roles : Array<StartRole>, idMap : Map<StartRole, Array<number>>) : Array<number> {
		let maxLength = 0;
		for (let i = 0; i < roles.length; ++i) {
			if (idMap.has(roles[i])) {
				maxLength = Math.max(maxLength, idMap.get(roles[i]).length);
			}
		}

		let finalIds = new Array();
		for (let i = 0; i < maxLength; ++i) {
			for (let j = 0; j < roles.length; ++j) {
				const currentRole = (i % 4 === 0 || i % 4 === 3) ? roles[j] : roles[roles.length - j - 1];

				if (idMap.has(currentRole)) {
					const ids = idMap.get(currentRole);
					finalIds.push(ids[i % ids.length]);
				}
			}
		}
		return finalIds;
	}

	current() : number {
		return this.get();
	}
	next() : number {
		if (this._index >= this._ids.length - 1) {		
			this._dir = -1;
		} else if (this._index <= 0) {
			this._dir = 1;
		}

		this._index += this._dir;
		return this.get();
	}
	private get() : number {
		if (this._ids.length === 0 || this._index < 0) {
			return 0;
		}
		return this._ids[this._index % this._ids.length];
	}

	seed(seed : number) : void { this._rng.seed(seed); }
}