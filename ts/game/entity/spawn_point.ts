import * as BABYLON from '@babylonjs/core/Legacy/legacy'
import earcut from 'earcut'

import { game } from 'game'
import { StepData } from 'game/game_object'
import { AttributeType } from 'game/component/api'
import { Association } from 'game/component/association'
import { Attributes } from 'game/component/attributes'
import { Model } from 'game/component/model'
import { Profile } from 'game/component/profile'
import { Entity, EntityBase, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { MaterialType } from 'game/factory/api'
import { BodyFactory } from 'game/factory/body_factory'
import { MaterialFactory } from 'game/factory/material_factory'

import { Timer } from 'util/timer'
import { Vec, Vec2 } from 'util/vector'

export class SpawnPoint extends EntityBase implements Entity {

	private static readonly _arrowVertices = [
        new BABYLON.Vector3(0.5, 0, 0),
        new BABYLON.Vector3(0, 0, 0.5),
        new BABYLON.Vector3(-0.5, 0, 0.5),
        new BABYLON.Vector3(0, 0, 0),
        new BABYLON.Vector3(-0.5, 0, -0.5),
        new BABYLON.Vector3(0, 0, -0.5),
	];
	private static readonly _interval = 3000;

	private _arrows : Array<BABYLON.Mesh>;
	private _arrowTimer : Timer;

	private _association : Association;
	private _model : Model;
	private _profile : Profile;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.SPAWN_POINT, entityOptions);

		this._arrows = new Array();
		this._arrowTimer = this.newTimer({
			canInterrupt: false,
		});

		this._association = this.addComponent<Association>(new Association(entityOptions.associationInit));

		this._model = this.addComponent<Model>(new Model({
			readyFn: () => { return this._profile.ready() && this._association.getTeam() > 0; },
			meshFn: (model : Model) => {
				let base = this.createArrow(0);
				[1, 2].forEach((i : number) => {
					const arrow = this.createArrow(i);
					base.addChild(arrow);
				})
				model.setMesh(base);
				model.setFrozen(true);
			},
			init: entityOptions.modelInit,
		}));

		this._profile = this.addComponent<Profile>(new Profile({
			bodyFn: (profile : Profile) => {
				return BodyFactory.circle(profile.pos(), profile.initDim(), {
					isStatic: true,
					isSensor: true,
					collisionFilter: BodyFactory.neverCollideFilter(),
				});
			},
			init: entityOptions.profileInit,
		}));
		this._profile.setVisible(false);
	}

	override initialize() : void {
		super.initialize();

		this._arrowTimer.start(SpawnPoint._interval);
	}

	override update(stepData : StepData) : void {
		super.update(stepData);

		if (this._arrows.length !== 3) {
			return;
		}

		if (this._arrowTimer.done()) {
			this._arrowTimer.start(SpawnPoint._interval);
		}

		if (this._arrowTimer.percentElapsed() <= 0.33) {
			this._arrows[1].isVisible = false;
			this._arrows[2].isVisible = false;
		} else if (this._arrowTimer.percentElapsed() <= 0.66) {
			this._arrows[1].isVisible = true;
		} else {
			this._arrows[2].isVisible = true;
		}
	}

	private createArrow(i : number) : BABYLON.Mesh {
		const goLeft = this._association.getTeam() === 2;

		let arrow = BABYLON.MeshBuilder.ExtrudePolygon(this.name() + "-arrow" + i, {
			shape: SpawnPoint._arrowVertices,
			depth: 0.3,
		}, game.scene(), earcut);
		arrow.position.x = i * 0.8 * (goLeft ? -1 : 1);
		arrow.position.y = -1;
		arrow.position.z = -3;
		arrow.rotation.x = Math.PI / 2;
		arrow.rotation.y = goLeft ? Math.PI : 0;
		arrow.material = MaterialFactory.material(MaterialType.SPAWN_POINT)
		this._arrows.push(arrow);
		return arrow;
	}
}