
import * as BABYLON from '@babylonjs/core/Legacy/legacy'

import { game } from 'game'
import { Model } from 'game/component/model'
import { Profile } from 'game/component/profile'
import { Resources } from 'game/component/resources'
import { Entity, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { BoundBase } from 'game/entity/bound'
import { ColorCategory, DepthType, SoundType, StatType } from 'game/factory/api'
import { SoundFactory } from 'game/factory/sound_factory'

import { Fns } from 'util/fns'

abstract class PlatformBase extends BoundBase {

	protected _outlineEdges : number;

	protected _model : Model;

	constructor(type : EntityType, entityOptions : EntityOptions) {
		super(type, entityOptions);

		this._outlineEdges = 0;

		this._model = this.addComponent<Model>(new Model({
			readyFn: () => { return this._profile.ready() },
			meshFn: (model : Model) => {
				const dim = this._profile.initDim();
				let mesh = BABYLON.MeshBuilder.CreateBox(this.name(), {
					width: dim.x,
					height: dim.y,
					depth: dim.z,
				}, game.scene());
				model.setMesh(mesh);
			},
			init: entityOptions.modelInit,
		}));

		this.addProp<number>({
			has: () => { return this._outlineEdges > 0; },
			import: (obj : number) => { this.outlineEdges(obj); },
			export: () => { return this._outlineEdges; },
		});
	}

	outlineEdges(width : number) : void {
		this._outlineEdges = width;

		this._model.onLoad((model : Model) => {
			model.mesh().enableEdgesRendering();
			model.mesh().edgesWidth = width;
			model.mesh().edgesColor = new BABYLON.Color4(0, 0, 0, 1);
		});
	}

	override initialize() : void {
		super.initialize();

		this._model.setFrozen(true);
	}
}

export class Platform extends PlatformBase {

	constructor(entityOptions : EntityOptions) {
		super(EntityType.PLATFORM, entityOptions);
	}
}

export class UnderwaterRock extends PlatformBase {

	private _exploded : boolean;

	private _resources : Resources;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.UNDERWATER_ROCK, entityOptions);

		this._exploded = false;

		this._resources = this.addComponent<Resources>(new Resources({
			stats: [StatType.HEALTH],
		}));

		this.addProp<boolean>({
			has: () => { return this._exploded; },
			import: (obj : boolean) => { this.explode(); },
			export: () => { return this._exploded; }
		})
	}

	override takeDamage(damage : number, from? : Entity, hitEntity? : Entity) : void {
		super.takeDamage(damage, from, hitEntity);

		if (this.dead()) {
			this.explode();
		}
	}

	explode() : void {
		if (this._exploded) {
			return;
		}

		this._exploded = true;
		if (this.initialized() && this._model.hasMaterialType()) {
			for (let i = 0; i < 9; ++i) {
				const dim = this._profile.dim();
				this.addEntity(EntityType.CUBE_PARTICLE, {
					offline: true,
					ttl: 1200,
					profileInit: {
						pos: this._profile.pos().clone().add({ x: Fns.randomNoise(dim.x / 3), y: Fns.randomNoise(dim.y / 3), }),
						vel: {
							x: Fns.randomNoise(0.2),
							y: Fns.randomRange(0.1, 0.2),
						},
						scaling: { x: 0.25, y: 0.25 },
						gravity: true,
					},
					modelInit: {
						materialType: this._model.materialType(),
					}
				});
			}

			SoundFactory.playFromPos(SoundType.ROCK_BREAK, this._profile.getRenderPos().toBabylon3());
		}
		this.delete();
	}
}