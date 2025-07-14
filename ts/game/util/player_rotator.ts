
import { PlayerConfig, PlayerInfo, StartRole } from 'game/util/player_config'

import { SeededRandom } from 'util/seeded_random'

class PlayerTrack {

	private _index : number;
	private _dir : number;
	private _ids : Array<number>;

	constructor(ids : Array<number>) {
		this._index = -1;
		this._dir = 1;
		this._ids = ids;
	}

	current() : number {
		return this.get();
	}
	next() : number {
		if (this._index >= this._ids.length - 1 && this._dir > 0) {
			this._index = this._ids.length - 1;
			this._dir = -1;
		} else if (this._index <= 0 && this._dir < 0) {
			this._index = 0;
			this._dir = 1;
		} else {
			this._index += this._dir;
		}
		return this.get();
	}
	opposing() : number {
		if (this._ids.length === 0 || this._index < 0) {
			return 0;
		}
		return this._ids[this._ids.length - 1 - (this._index % this._ids.length)];

	}
	private get() : number {
		if (this._ids.length === 0 || this._index < 0) {
			return 0;
		}
		return this._ids[this._index % this._ids.length];
	}

}

export class PlayerRotator {

	private static readonly _trackedRoles = new Set<StartRole>([StartRole.PLAYING, StartRole.TEAM_ONE, StartRole.TEAM_TWO]);

	private _tracks : Map<StartRole, PlayerTrack>;
	private _rng : SeededRandom;

	constructor() {
		this._tracks = new Map();
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

		if (idMap.has(StartRole.PLAYING)) {
			this._tracks.set(StartRole.PLAYING, new PlayerTrack(idMap.get(StartRole.PLAYING)));
		} else {
			this._tracks.set(StartRole.PLAYING, new PlayerTrack(this.weave([StartRole.TEAM_ONE, StartRole.TEAM_TWO], idMap)));
		}

		if (idMap.has(StartRole.TEAM_ONE)) {
			this._tracks.set(StartRole.TEAM_ONE, new PlayerTrack(idMap.get(StartRole.TEAM_ONE)));
		}
		if (idMap.has(StartRole.TEAM_TWO)) {
			this._tracks.set(StartRole.TEAM_TWO, new PlayerTrack(idMap.get(StartRole.TEAM_TWO)));
		}
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

	current(role : StartRole) : number {
		if (!this._tracks.has(role)) {
			return 0;
		}
		return this._tracks.get(role).current();
	}
	opposing(role : StartRole) : number {
		if (!this._tracks.has(role)) {
			return 0;
		}
		return this._tracks.get(role).opposing();
	}
	next(role : StartRole) : number {
		if (!this._tracks.has(role)) {
			return 0;
		}
		return this._tracks.get(role).next();
	}
	currentFromAll() : number { return this.current(StartRole.PLAYING); }
	nextFromAll() : number { return this.next(StartRole.PLAYING); }
	nextExcluding(id : number) {
		for (let i = 0; i < 10; ++i) {
			const next = this.nextFromAll();
			if (next !== id) {
				return next;
			}
		}
		return this.nextFromAll();
	}
	nextN(n : number) : number {
		for (let i = 0; i < n - 1; ++i) {
			this.nextFromAll();
		}
		return this.nextFromAll();
	}
	opposingFromAll() : number { return this.opposing(StartRole.PLAYING); }
	nextFromTeamOne() : number { return this.next(StartRole.TEAM_ONE); }
	nextFromTeamTwo() : number { return this.next(StartRole.TEAM_TWO);}

	seed(seed : number) : void { this._rng.seed(seed); }
}