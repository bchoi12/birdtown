import * as BABYLON from '@babylonjs/core/Legacy/legacy'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { GameMode } from 'game/api'
import { StepData } from 'game/game_object'
import { Model } from 'game/component/model'
import { Profile } from 'game/component/profile'
import { Entity, EquipEntity, EntityBase, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Equip } from 'game/entity/equip'
import { NameTag } from 'game/entity/equip/name_tag'
import { MeshType } from 'game/factory/api'
import { BodyFactory } from 'game/factory/body_factory'
import { MeshFactory, LoadResult } from 'game/factory/mesh_factory'

import { UiMessage, UiMessageType } from 'message/ui_message'

import { settings } from 'settings'

import { ui } from 'ui'
import { KeyType, KeyState, TooltipType } from 'ui/api'
import { KeyNames } from 'ui/common/key_names'

import { ChangeTracker } from 'util/change_tracker'

// TODO: turn into abstract class
export class Sign extends EntityBase implements Entity, EquipEntity {

	private _active : boolean;
	private _hasCollision : boolean;
	private _tooltipType : TooltipType;

	private _nameTag : NameTag;

	private _model : Model;
	private _profile : Profile;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.SIGN, entityOptions);

		this._active = false;
		this._hasCollision = false;
		this._tooltipType = entityOptions.tooltipType ? entityOptions.tooltipType : TooltipType.JUST_A_SIGN;

		this._nameTag = null;

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
					model.translation().z = -1.5;
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

	override initialize() : void {
		super.initialize();

		const [nameTag, hasNameTag] = this.addEntity<NameTag>(EntityType.NAME_TAG, {
			associationInit: {
				owner: this,
			},
			offline: true,
		});

		if (!hasNameTag) {
			console.error("Error: could not create name tag for ", this.name());
			this.delete();
			return;
		}

		this._nameTag = nameTag;
		this._nameTag.setDisplayName("Start Game");
	}

	equip(equip : Equip<Entity & EquipEntity>) : void {
		if (equip.type() !== EntityType.NAME_TAG) {
			console.error("Error: skipping attaching %s to %s", equip.name(), this.name());
			return;
		}

		this._model.onLoad((m : Model) => {
			let equipModel = equip.model();
			equipModel.onLoad((em : Model) => {
				em.root().parent = m.root();
			});
		});
	}

	setActive(active : boolean) : void {
		if (this._active === active) {
			return;
		}

		this._active = active;

		if (this._active) {
			this._nameTag.setVisible(false);
		} else {
			this._nameTag.setVisible(true);
		}
	}

	override prePhysics(stepData : StepData) : void {
		super.prePhysics(stepData);

		this._hasCollision = false;
	}

	override collide(collision : MATTER.Collision, other : Entity) : void {
		super.collide(collision, other);

		if (other.type() !== EntityType.PLAYER) {
			return;
		}

		if (!game.lakitu().hasTargetEntity() || game.lakitu().targetEntity().id() !== other.id()) {
			return;
		}

		this._hasCollision = true;
	}

	override postPhysics(stepData : StepData) : void {
		super.postPhysics(stepData);

		this.setActive(this._hasCollision);

		if (this._active) {
			let msg = new UiMessage(UiMessageType.TOOLTIP);
			msg.setTtl(100);
			msg.setTooltipType(this._tooltipType);
			ui.handleMessage(msg);

			if (this.key(KeyType.INTERACT, KeyState.PRESSED)) {
				switch (this._tooltipType) {
				case TooltipType.START_GAME:
					// TODO: show dialog instead
					if (this.isSource()) {
						game.controller().startGame(GameMode.DUEL);
					}
					break;
				}
			}
		}
	}
}