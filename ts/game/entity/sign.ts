import * as BABYLON from '@babylonjs/core/Legacy/legacy'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { GameMode } from 'game/api'
import { StepData } from 'game/game_object'
import { Model } from 'game/component/model'
import { Profile } from 'game/component/profile'
import { Entity, EntityBase, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { MeshType } from 'game/factory/api'
import { BodyFactory } from 'game/factory/body_factory'
import { MeshFactory, LoadResult } from 'game/factory/mesh_factory'

import { UiMessage, UiMessageType } from 'message/ui_message'

import { ui } from 'ui'
import { DialogType, KeyType, KeyState, TooltipType } from 'ui/api'

export abstract class Sign extends EntityBase implements Entity {

	protected _active : boolean;

	protected _model : Model;
	protected _profile : Profile;

	constructor(type : EntityType, entityOptions : EntityOptions) {
		super(type, entityOptions);
		this.addType(EntityType.SIGN);

		this._active = false;

		this.addProp<boolean>({
			export: () => { return this._active; },
			import: (obj : boolean) => { this._active = obj; },
		});

		this._model = this.addComponent<Model>(new Model({
			readyFn: () => {
				return this._profile.ready();
			},
			meshFn: (model : Model) => {
				MeshFactory.load(MeshType.SIGN, (result : LoadResult) => {
					let mesh = <BABYLON.Mesh>result.meshes[0];
					model.offlineTransforms().setTranslation({z: -1.5 });
					model.setMesh(mesh);
				});
			},
		}));

		this._profile = this.addComponent<Profile>(new Profile({
			bodyFn: (profile : Profile) => {
				return BodyFactory.rectangle(profile.pos(), profile.dim(), {
					isStatic: true,
					isSensor: true,
					render: {
						visible: false,
					},
				});
			},
			init: entityOptions.profileInit,
		}));
	}

	abstract showTooltip() : void;

	override prePhysics(stepData : StepData) : void {
		super.prePhysics(stepData);

		this._active = false;
	}

	override collide(collision : MATTER.Collision, other : Entity) : void {
		super.collide(collision, other);

		if (other.type() !== EntityType.PLAYER) {
			return;
		}

		if (!other.clientIdMatches()) {
			return;
		}

		this._active = true;
	}

	override postPhysics(stepData : StepData) : void {
		super.postPhysics(stepData);
		const seqNum = stepData.seqNum;

		if (!this._active) {
			return;
		}

		this.showTooltip();
	}
}