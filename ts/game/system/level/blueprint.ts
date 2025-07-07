
import { EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { LevelType, LevelLayout } from 'game/system/api'

import { GameMessage } from 'message/game_message'

import { defined } from 'util/common'
import { Vec, Vec2 } from 'util/vector'
import { SeededRandom } from 'util/seeded_random'

export type BlueprintOptions = {
	msg : GameMessage;
	pos : Vec;
}

export type BlueprintEntity = {
	type : EntityType;
	options : EntityOptions;
}

export abstract class Blueprint<T extends BlueprintBlock> {

	private _rng : SeededRandom;
	private _chance : number;
	private _options : BlueprintOptions

	constructor(options : BlueprintOptions) {
		this._rng = new SeededRandom(0);
		this._chance = 0;
		this._options = options;

		this._rng.seed(options.msg.getLevelSeed());
	}

	options() : BlueprintOptions { return this._options; }
	getType() : LevelType { return this._options.msg.getLevelTypeOr(LevelType.UNKNOWN); }
	getLayout() : LevelLayout { return this._options.msg.getLevelLayoutOr(LevelLayout.NORMAL); }
	getNumPlayers() : number { return this._options.msg.getNumPlayersOr(0); }
	rng() : SeededRandom { return this._rng; }
	abstract load() : void;
	abstract blocks() : Array<T>;

	minBuffer() : number { return 0; }
	sideBuffer() : number { return 0; }
	seamBuffer() : number { return 0; }
}

export abstract class BlueprintBlock {

	private _type : EntityType;
	private _options : EntityOptions;
	private _entities : Array<BlueprintEntity>;
	private _pos : Vec2;

	constructor(type : EntityType, options : EntityOptions) {
		this._type = type;
		this._options = options;
		this._entities = new Array();
		this._pos = Vec2.zero();
		if (options.profileInit && options.profileInit.pos) {
			this._pos.copyVec(options.profileInit.pos);
		}

		this.pushEntityOptions(type, this._options);
	}

	entityType() : EntityType { return this._type; }
	protected hasPos() : boolean { return defined(this._options.profileInit, this._options.profileInit.pos) }
	pos() : Vec { return this.hasPos() ? this._options.profileInit.pos : {x: 0, y: 0}; }
	abstract dim() : Vec;

	options() : EntityOptions { return this._options; }
	entities() : Array<BlueprintEntity> { return this._entities; }
	pushEntityOptions(type : EntityType, options : EntityOptions) {
		this._entities.push({ type: type, options: options });
	}
}
