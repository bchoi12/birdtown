import * as MATTER from 'matter-js'

import { game } from 'game'	
import { ColorFactory } from 'game/color_factory'
import { EntityType } from 'game/entity'
import { System, SystemBase, SystemType } from 'game/system'

import { Data } from 'network/data'

import { defined, isLocalhost } from 'util/common'
import { ChangeTracker } from 'util/change_tracker'
import { HexColor } from 'util/hex_color'

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

	private _level : LevelType;
	private _seed : number;
	private _reloadLevel : boolean;

	constructor() {
		super(SystemType.LEVEL);

		this._level = LevelType.UNKNOWN;
		this._seed = 0;
		this._reloadLevel = false;

		this.registerProp(Prop.LEVEL, {
			has: () => { return this._level > 0; },
			export: () => { return this._level; },
			import: (obj : Object) => { this.setLevel(<number>obj); },
			filters: Data.tcp,
		});
		this.registerProp(Prop.SEED, {
			has: () => { return this._seed > 0; },
			export: () => { return this._seed; },
			import: (obj : Object) => { this.setSeed(<number>obj); },
			filters: Data.tcp,
		});
	}

	setLevel(level : LevelType) : void {
		if (level !== LevelType.UNKNOWN && this._level !== level) {
			this._level = level;
			this._reloadLevel = true;
		}
	}
	setSeed(seed : number) : void {
		if (seed > 0 && this._seed !== seed) {
			this._seed = seed;
			this._reloadLevel = true;
		}
	}

	override preUpdate(millis : number) : void {
		super.preUpdate(millis);

		if (this._reloadLevel) {
			this.loadLevel();
		}
	}

	// TODO: allow client to load the level themselves? Race conditions could be nasty
	private loadLevel() : void {
		if (isLocalhost()) {
			console.log("Loading level %d with seed %d", this._level, this._seed);
		}

		this._reloadLevel = false;

		let entities = game.entities();
		let colors = ColorFactory.generateColorMap(EntityType.ARCH_ROOM, this._seed);
	    entities.addEntity(EntityType.ARCH_ROOM, {
	    	profileInit: {
	    		pos: {x: -12, y: 2},
	    	},
	    	hexColorsInit: {
	    		colors: colors,
	    	},
	    });
	    entities.addEntity(EntityType.ARCH_ROOM, {
	    	profileInit: {
	    		pos: {x: -12, y: 8},
	    	},
	    	hexColorsInit: {
	    		colors: colors,
	    	},
	    });
	    entities.addEntity(EntityType.ARCH_ROOF, {
	    	profileInit: {
	    		pos: {x: -12, y: 11.5},
	    	},
	    	hexColorsInit: {
	    		colors: colors,
	    	},
	    });

		colors = ColorFactory.generateColorMap(EntityType.ARCH_ROOM, this._seed * 2);
	    entities.addEntity(EntityType.ARCH_ROOM, {
	    	profileInit: {
	    		pos: {x: 0, y: 2},
	    	},
	    	hexColorsInit: {
	    		colors: colors,
	    	},
	    });
	    entities.addEntity(EntityType.ARCH_ROOM, {
	    	profileInit: {
	    		pos: {x: 0, y: 8},
	    	},
	    	hexColorsInit: {
	    		colors: colors,
	    	},
	    });
	    entities.addEntity(EntityType.ARCH_ROOM, {
	    	profileInit: {
	    		pos: {x: 0, y: 14},
	    	},
	    	hexColorsInit: {
	    		colors: colors,
	    	},
	    });
	    entities.addEntity(EntityType.ARCH_ROOF, {
	    	profileInit: {
	    		pos: {x: 0, y: 17.5},
	    	},
	    	hexColorsInit: {
	    		colors: colors,
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

	    game.systemRunner().onLevelLoad(this._level, this._seed);

	}
}
		