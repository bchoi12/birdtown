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
import { ColorFactory } from 'game/factory/color_factory'
import { MeshFactory, LoadResult } from 'game/factory/mesh_factory'

import { UiMessage, UiMessageType } from 'message/ui_message'

import { settings } from 'settings'

import { ui } from 'ui'
import { KeyType, KeyState, TooltipType } from 'ui/api'

import { Optional } from 'util/optional'

export abstract class Sign extends EntityBase implements Entity, EquipEntity {

	private _active : boolean;
	private _hasCollision : boolean;
	private _interacting : boolean;

	private _nameTag : Optional<NameTag>;

	private _model : Model;
	private _profile : Profile;

	constructor(type : EntityType, entityOptions : EntityOptions) {
		super(type, entityOptions);
		this.addType(EntityType.SIGN);

		this._active = false;
		this._hasCollision = false;

		this._nameTag = new Optional();

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

		const text = this.nameTagText();
		if (text.length === 0) {
			return;
		}

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

		nameTag.setDisplayName(text);
		nameTag.setPointerColor(ColorFactory.signGray.toString());
		this._nameTag.set(nameTag);
	}

	abstract nameTagText() : string;
	abstract tooltipType() : TooltipType;

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

	interactable() : boolean { return true; }
	interact() : void { this._interacting = true; }

	setActive(active : boolean) : void {
		if (this._active === active) {
			return;
		}

		this._active = active;

		if (!this._nameTag.has()) {
			return;
		}

		if (this._active) {
			this._nameTag.get().setVisible(false);
		} else {
			this._nameTag.get().setVisible(true);
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

		if (!other.isLakituTarget()) {
			return;
		}

		this._hasCollision = true;
	}

	override postPhysics(stepData : StepData) : void {
		super.postPhysics(stepData);

		this.setActive(this._hasCollision);

		if (this._active && !this._interacting) {
			let msg = new UiMessage(UiMessageType.TOOLTIP);
			msg.setTtl(100);
			msg.setTooltipType(this.tooltipType());
			ui.handleMessage(msg);

			if (this.key(KeyType.INTERACT, KeyState.PRESSED) && this.interactable()) {
				this.interact();
			}
		} else if (!this._active && this._interacting) {
			// Allow interaction after moving away from sign
			this._interacting = false;
		}
	}
}