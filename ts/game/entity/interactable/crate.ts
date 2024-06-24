import * as BABYLON from '@babylonjs/core/Legacy/legacy'

import { game } from 'game'
import { StepData } from 'game/game_object'
import { AttributeType, ComponentType } from 'game/component/api'
import { Attributes } from 'game/component/attributes'
import { Model } from 'game/component/model'
import { Profile } from 'game/component/profile'
import { Entity, EntityBase, EntityOptions, EquipEntity } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Equip } from 'game/entity/equip'
import { NameTag } from 'game/entity/equip/name_tag'
import { Interactable } from 'game/entity/interactable'
import { Player } from 'game/entity/player'
import { CollisionCategory, MaterialType, MeshType } from 'game/factory/api'
import { BodyFactory } from 'game/factory/body_factory'
import { ColorFactory } from 'game/factory/color_factory'
import { EntityFactory } from 'game/factory/entity_factory'
import { MeshFactory, LoadResult } from 'game/factory/mesh_factory'

import { GameGlobals } from 'global/game_globals'

import { settings } from 'settings'

import { StringFactory } from 'strings/string_factory'

import { ui } from 'ui'
import { TooltipType } from 'ui/api'
import { KeyNames } from 'ui/common/key_names'

import { Fns } from 'util/fns'

export class Crate extends Interactable implements Entity, EquipEntity {

	private static readonly _equipPairs = [
		[EntityType.CLAW, EntityType.HEADBAND],
		[EntityType.SNIPER, EntityType.SCOUTER],
		[EntityType.BAZOOKA, EntityType.JETPACK],
	];

	private static _maxSpeed = 0.6;

	private _opened : boolean;
	private _showTooltip : boolean;
	private _equipType : EntityType;
	private _altEquipType : EntityType;

	private _nameTag : NameTag;

	private _attributes : Attributes;
	private _profile : Profile;
	private _model : Model;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.CRATE, entityOptions);

		this._opened = false;
		this._showTooltip = false;
		this._equipType = EntityType.UNKNOWN;
		this._altEquipType = EntityType.UNKNOWN;

		if (this.isSource()) {
			const index = Math.floor(Math.random() * Crate._equipPairs.length);
			this._equipType = Crate._equipPairs[index][0];
			this._altEquipType = Crate._equipPairs[index][1];
		}

		this._nameTag = null;

		this.addProp<boolean>({
			has: () => { return this._opened; },
			export: () => { return this._opened; },
			import: (obj : boolean) => {
				this.open();
				this.delete();
			},
		});
		this.addProp<EntityType>({
			has: () => { return this._equipType !== EntityType.UNKNOWN; },
			export: () => { return this._equipType; },
			import: (obj : EntityType) => { this._equipType = obj; },
		});
		this.addProp<EntityType>({
			has: () => { return this._altEquipType !== EntityType.UNKNOWN; },
			export: () => { return this._altEquipType; },
			import: (obj : EntityType) => { this._altEquipType = obj; },
		});

		this._attributes = this.addComponent<Attributes>(new Attributes(entityOptions.attributesInit));
		this._attributes.setAttribute(AttributeType.SOLID, true);

		this._profile = this.addComponent<Profile>(new Profile({
			bodyFn: (profile : Profile) => {
				return BodyFactory.rectangle(profile.pos(), profile.unscaledDim(), {
					density: BodyFactory.defaultDensity,
					collisionFilter: BodyFactory.collisionFilter(CollisionCategory.SOLID),
					render: {
						fillStyle: ColorFactory.crateRed.toString(),
					},
				});
			},
			init: {...entityOptions.profileInit },
		}));
		this._profile.setAcc({ y: GameGlobals.gravity });
		if (!this._profile.hasAngle()) {
			this._profile.setAngle(0);
		}
		this._profile.setRenderUnoccluded();
		this._profile.setLimitFn((profile : Profile) => {
			profile.capSpeed(0.6);
		});

		this._model = this.addComponent<Model>(new Model({
			readyFn: () => {
				return this._profile.ready();
			},
			meshFn: (model : Model) => {
				MeshFactory.load(MeshType.CRATE, (result : LoadResult) => {
					let mesh = <BABYLON.Mesh>result.meshes[0];
					const modelDimension = EntityFactory.getDimension(this.type());
					let scaling = {
						x: this._profile.scaledDim().x / modelDimension.x,
						y: this._profile.scaledDim().y / modelDimension.y,
					}
					mesh.scaling.set(scaling.x, scaling.y, (scaling.x + scaling.y) / 2);
					model.setMesh(mesh);
				});
			},
			init: entityOptions.modelInit,
		}));
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
		this._nameTag.setVisible(false);
		this._nameTag.setDisplayName(KeyNames.boxed(settings.interactKeyCode));
	}

	override delete() : void {
		super.delete();

		if (this._opened) {
			for (let i = 0; i < 5; ++i) {
				this.addEntity(EntityType.PARTICLE_CUBE, {
					offline: true,
					ttl: 1000,
					profileInit: {
						pos: this._profile.pos().clone().add({ x: Fns.randomRange(-0.1, 0.1), y: Fns.randomRange(-0.1, 0.1), }),
						vel: {
							x: Fns.randomRange(-0.2, 0.2),
							y: Fns.randomRange(0.2, 0.3),
						},
						scaling: { x: 0.25, y: 0.25 },
					},
					modelInit: {
						transforms: {
							translate: { z: this._model.mesh().position.z + Fns.randomRange(-0.1, 0.1) },
						},
						materialType: i % 2 === 1 ? MaterialType.CRATE_YELLOW : MaterialType.CRATE_RED,
					}
				});
			}
		}

		if (this._nameTag !== null) {
			this._nameTag.delete();
		}
	}

	equipType() : EntityType { return this._equipType; }
	altEquipType() : EntityType { return this._altEquipType; }
	equipList() : string {
		return StringFactory.getEntityTypeName(this._equipType).base() + " and " + StringFactory.getEntityTypeName(this._altEquipType).base();
	}

	override setInteractableWith(entity : Entity, interactable : boolean) : void {
		super.setInteractableWith(entity, interactable);

		if (entity.isLakituTarget()) {
			this._showTooltip = interactable;

			if (this._nameTag !== null) {
				this._nameTag.setVisible(interactable);
			}
		}
	}
	override interactWith(entity : Entity) : void {
		if (entity.type() !== EntityType.PLAYER) {
			return;
		}

		const player = <Player>entity;
		player.createEquips(this.equipType(), this.altEquipType());

		this.open();

		if (this.isSource()) {
			this.delete();
		}
	}
	private open() : void {
		this.clearInteractable();
		this._opened = true;
	}
	
	equip(equip : Equip<Entity & EquipEntity>) : void {
		if (equip.type() !== EntityType.NAME_TAG) {
			console.error("Error: trying to attach %s to %s", equip.name(), this.name());
			return;
		}
	}

	override update(stepData : StepData) : void {
		super.update(stepData);

		if (this._profile.pos().y < game.level().bounds().min.y) {
			this.delete();
		}
	}

	override postPhysics(stepData : StepData) : void {
		super.postPhysics(stepData);

		this._nameTag.model().translation().copyVec(this._profile.pos());
	}

	override preRender() : void {
		super.preRender();

		if (this._showTooltip) {
			ui.showTooltip({
				type: TooltipType.OPEN_CRATE,
				ttl: 50,
				names: [this.equipList()],
			});
		}
	}
}