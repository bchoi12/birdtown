import * as MATTER from 'matter-js'

import { game } from 'game'	
import { EntityType } from 'game/entity'
import { System, SystemBase, SystemType } from 'game/system'

import { Data } from 'network/data'

import { defined } from 'util/common'
import { ChangeTracker } from 'util/change_tracker'

enum Prop {
	UNKNOWN,
	LEVEL,
	SEED,
}

export enum LevelType {
	UNKNOWN,
	TEST,
}

export class Level extends SystemBase implements System {

	private _levelTracker : ChangeTracker<LevelType>;

	private _level : LevelType;
	private _seed : number;

	constructor() {
		super(SystemType.LEVEL);

		this.registerProp(Prop.LEVEL, {
			has: () => { return this._level > 0; },
			export: () => { return this._level; },
			import: (obj : Object) => { this._level = <number>obj; },
			filters: Data.tcp,
		});

		this.registerProp(Prop.SEED, {
			has: () => { return this._seed > 0; },
			export: () => { return this._seed; },
			import: (obj : Object) => { this._seed = <number>obj; },
			filters: Data.tcp,
		});

		this._levelTracker = new ChangeTracker<LevelType>(() => {
			return this._level;
		}, (level : LevelType) => {
			this.loadLevel(level);
		});
		this._levelTracker.set(LevelType.UNKNOWN);
	}

	setLevel(type : LevelType, seed : number) : void {
		this._level = type;
		this._seed = seed;

		let entities = game.entities();
		entities.reset();
	}

	override preUpdate(millis : number) : void {
		super.preUpdate(millis);

		this._levelTracker.check();
	}

	private loadLevel(type : LevelType) : void {
		let entities = game.entities();

	    entities.addEntity(EntityType.WALL, {
	    	profileInit: {
		    	pos: {x: 0, y: 0},
		    	dim: {x: 16, y: 1},
	    	},
	    });

	    entities.addEntity(EntityType.WALL, {
	    	profileInit: {
	    		pos: {x: 3, y: 1},
	    		dim: {x: 1, y: 1},
	    	},
	    });
	    entities.addEntity(EntityType.WALL, {
	    	profileInit: {
		    	pos: {x: 6, y: 3},
	    		dim: {x: 2, y: 1},
			},
	    });

	    entities.addEntity(EntityType.CRATE, {
	    	profileInit: {
		    	pos: {x: 1, y: 4},
		    	dim: {x: 1, y: 1},
	    	},
	    });
	    entities.addEntity(EntityType.CRATE, {
	    	profileInit: {
		    	pos: {x: 1.5, y: 6},
		    	dim: {x: 2, y: 1},
	    	},
	    });
	    entities.addEntity(EntityType.CRATE, {
	    	profileInit: {
		    	pos: {x: 2, y: 8},
		    	dim: {x: 0.5, y: 1},
	    	},
	    });

	}
}
		