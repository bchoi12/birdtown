import * as BABYLON from '@babylonjs/core/Legacy/legacy'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { GameMode } from 'game/api'
import { StepData } from 'game/game_object'
import { Model } from 'game/component/model'
import { Profile } from 'game/component/profile'
import { Entity, EntityBase, EntityOptions, EquipEntity } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Equip } from 'game/entity/equip'
import { NameTag } from 'game/entity/equip/name_tag'
import { Interactable } from 'game/entity/interactable'
import { CollisionCategory, DepthType, MeshType } from 'game/factory/api'
import { BodyFactory } from 'game/factory/body_factory'
import { ColorFactory } from 'game/factory/color_factory'
import { MeshFactory, LoadResult } from 'game/factory/mesh_factory'

import { ui } from 'ui'
import { TooltipType } from 'ui/api'

export abstract class Sign extends Interactable implements Entity, EquipEntity {

	protected _showTooltip : boolean;

	protected _nameTag : NameTag;

	protected _model : Model;
	protected _profile : Profile;

	constructor(type : EntityType, entityOptions : EntityOptions) {
		super(type, entityOptions);
		this.addType(EntityType.SIGN);

		this._showTooltip = false;

		this._nameTag = null;

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
					collisionFilter: BodyFactory.collisionFilter(CollisionCategory.INTERACTABLE),
				});
			},
			init: entityOptions.profileInit,
		}));
		this._profile.setMinimapOptions({
			color: ColorFactory.archWood.toString(),
			depthType: DepthType.BEHIND,
		});
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
		this._nameTag = nameTag;
	}

	override delete() : void {
		super.delete();

		if (this._nameTag !== null) {
			this._nameTag.delete();
		}
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

	override canInteractWith(entity : Entity) : boolean {
		return entity.clientIdMatches() && super.canInteractWith(entity);
	}

	override setInteractableWith(entity : Entity, interactable : boolean) : void {
		super.setInteractableWith(entity, interactable);

		if (entity.isLakituTarget()) {
			this._showTooltip = interactable;
		}
	}
	override interactWith(entity : Entity) : void {
		if (!entity.clientIdMatches()) {
			return;
		}

		this._showTooltip = false;
	}

	override preRender() : void {
		super.preRender();

		// Don't clutter screen if tooltip is up
		if (this._nameTag !== null) {
			this._nameTag.setVisible(!this._showTooltip);
		}

		if (this._showTooltip) {
			ui.showTooltip(this.tooltipType(), {
				ttl: 100,
			});
		}
	}
}