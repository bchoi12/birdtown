import * as BABYLON from '@babylonjs/core/Legacy/legacy'
import * as MATTER from 'matter-js'

import { game } from 'game'
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
import { DialogType, TooltipType } from 'ui/api'

import { ChangeTracker } from 'util/change_tracker'

export class Sign extends EntityBase implements Entity {

	private _active : boolean;
	private _activeTracker : ChangeTracker<boolean>;
	private _tooltipType : TooltipType;

	private _model : Model;
	private _profile : Profile;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.SIGN, entityOptions);

		this._active = false;
		this._activeTracker = new ChangeTracker(() => {
			return this._active;
		}, (active : boolean) => {
			if (active) {
				this._model.applyToMeshes((mesh : BABYLON.Mesh) => {
					game.world().highlight(mesh, {
						enabled: true,
						color: BABYLON.Color3.White(),
					});
				});
			} else {
				this._model.applyToMeshes((mesh : BABYLON.Mesh) => {
					game.world().highlight(mesh, {
						enabled: false,
					});
				});
			}
		});
		this._tooltipType = entityOptions.tooltipType ? entityOptions.tooltipType : TooltipType.JUST_A_SIGN;

		this.addProp<TooltipType>({
			export: () => { return this._tooltipType; },
			import: (obj : TooltipType) => { this._tooltipType = obj; },
		});

		this._model = this.addComponent<Model>(new Model({
			readyFn: () => {
				return this._profile.ready();
			},
			meshFn: (model : Model) => {
				MeshFactory.load(MeshType.SIGN, (result : LoadResult) => {
					let mesh = <BABYLON.Mesh>result.meshes[0];
					mesh.position.z = -1.5;
					model.setMesh(mesh);
				});
			},
			init: entityOptions.modelInit,
		}));

		this._profile = this.addComponent<Profile>(new Profile({
			bodyFn: (profile : Profile) => {
				return BodyFactory.rectangle(profile.pos(), profile.unscaledDim(), {
					isStatic: true,
					isSensor: true,
				});
			},
			init: entityOptions.profileInit,
		}));
		this._profile.setRenderNever();
	}

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

		if (this._active) {
			let msg = new UiMessage(UiMessageType.TOOLTIP);
			msg.setTtl(100);
			msg.setTooltipType(this._tooltipType);
			ui.handleMessage(msg);
		}

		this._activeTracker.check();
	}
}