import * as BABYLON from '@babylonjs/core/Legacy/legacy'

import { game } from 'game'
import { StepData } from 'game/game_object'
import { AttributeType, ComponentType, StatType } from 'game/component/api'
import { Attributes } from 'game/component/attributes'
import { Model } from 'game/component/model'
import { Profile } from 'game/component/profile'
import { Stats } from 'game/component/stats'
import { Entity, EntityOptions, EquipEntity, InteractEntity } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Equip } from 'game/entity/equip'
import { NameTag } from 'game/entity/equip/name_tag'
import { Interactable } from 'game/entity/interactable'
import { CollisionCategory, MaterialType, MeshType, SoundType } from 'game/factory/api'
import { BodyFactory } from 'game/factory/body_factory'
import { EntityFactory } from 'game/factory/entity_factory'
import { MeshFactory, LoadResult } from 'game/factory/mesh_factory'
import { MaterialShifter } from 'game/util/material_shifter'

import { GameGlobals } from 'global/game_globals'

import { settings } from 'settings'

import { ui } from 'ui'
import { KeyNames } from 'ui/common/key_names'

import { Box2 } from 'util/box'
import { Fns } from 'util/fns'

export abstract class Crate extends Interactable implements Entity, EquipEntity, InteractEntity {

	private static readonly _maxSpeed = 0.5;

	private _materialShifter : MaterialShifter;
	private _opened : boolean;
	private _exploded : boolean;

	private _nameTag : NameTag;

	protected _attributes : Attributes;
	protected _profile : Profile;
	protected _model : Model;
	protected _stats : Stats

	constructor(type : EntityType, entityOptions : EntityOptions) {
		super(type, entityOptions);

		this.allTypes().add(EntityType.CRATE);

		this._materialShifter = new MaterialShifter();
		this._opened = false;
		this._exploded = false;

		this._nameTag = null;

		this.addProp<boolean>({
			has: () => { return this._opened; },
			export: () => { return this._opened; },
			import: (obj : boolean) => {
				this.open();
			},
		});

		this._attributes = this.addComponent<Attributes>(new Attributes(entityOptions.attributesInit));
		this._attributes.setAttribute(AttributeType.SOLID, true);

		this._profile = this.addComponent<Profile>(new Profile({
			bodyFn: (profile : Profile) => {
				return BodyFactory.rectangle(profile.pos(), profile.unscaledDim(), {
					density: 0.8 * BodyFactory.defaultDensity,
					collisionFilter: BodyFactory.collisionFilter(CollisionCategory.SOLID),
					chamfer: {
						radius: 0.05
					},
				});
			},
			init: {...entityOptions.profileInit },
		}));
		this._profile.setAcc({ y: GameGlobals.gravity });
		if (!this._profile.hasAngle()) {
			this._profile.setAngle(0);
		}
		this._profile.setLimitFn((profile : Profile) => {
			profile.capSpeed(Crate._maxSpeed);
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

					mesh.getChildMeshes().forEach((mesh : BABYLON.Mesh) => {
						if (!mesh.material || !(mesh.material instanceof BABYLON.PBRMaterial)) { return; }

						if (mesh.material.name === "crate") {
							this._materialShifter.setMaterial(mesh.material, Box2.fromBox({
								min: {x: 0, y: 0},
								max: {x: 1, y: 2},
							}));

							this._materialShifter.registerOffset(EntityType.HEALTH_CRATE, {x: 0, y: 0});
							this._materialShifter.registerOffset(EntityType.WEAPON_CRATE, {x: 0, y: 1});
							this._materialShifter.offset(this.type());
						}
					});

					model.setMesh(mesh);
				});
			},
			init: entityOptions.modelInit,
		}));

		this._stats = this.addComponent<Stats>(new Stats());
		this._stats.addStat(StatType.HEALTH, {
			base: 40,
			min: 0,
			max: 40,
		});
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

		if (this._model.hasMesh() && this._opened && !this._exploded) {
			for (let i = 0; i < 7; ++i) {
				this.addEntity(EntityType.CUBE_PARTICLE, {
					offline: true,
					ttl: 1200,
					profileInit: {
						pos: this._profile.pos().clone().add({ x: Fns.randomRange(-0.1, 0.1), y: Fns.randomRange(-0.1, 0.1), }),
						vel: {
							x: Fns.randomRange(-0.15, 0.15),
							y: Fns.randomRange(0.2, 0.3),
						},
						scaling: { x: 0.25, y: 0.25 },
					},
					modelInit: {
						transforms: {
							translate: { z: this._model.mesh().position.z + Fns.randomRange(-0.2, 0.2) },
						},
						materialType: i % 2 === 1 ? MaterialType.PICKUP_YELLOW : this.outerMaterial(),
					}
				});
			}
			this._exploded = true;
		}

		if (this._nameTag !== null) {
			this._nameTag.delete();
		}
	}

	override canInteractWith(entity : Entity) : boolean {
		return this.isSource() && super.canInteractWith(entity);
	}

	override setInteractableWith(entity : Entity, interactable : boolean) : void {
		super.setInteractableWith(entity, interactable);

		if (entity.isLakituTarget()) {
			if (this._nameTag !== null) {
				this._nameTag.setVisible(interactable);
			}
		}
	}

	override impactSound() : SoundType { return SoundType.WOOD_THUD; }

	abstract outerMaterial() : MaterialType;
	protected open() : void {
		this.clearInteractable();
		this._opened = true;

		if (this.isSource()) {
			this.delete();
		}
	}
	opened() : boolean { return this._opened; }
	
	equip(equip : Equip<Entity & EquipEntity>) : void {
		if (equip.type() !== EntityType.NAME_TAG) {
			console.error("Error: trying to attach %s to %s", equip.name(), this.name());
			return;
		}
	}

	override update(stepData : StepData) : void {
		super.update(stepData);

		if (this._stats.dead() && !this.opened()) {
			this.open();
			return;
		}

		if (this._profile.pos().y < game.level().bounds().min.y) {
			this.delete();
		}
	}

	override postPhysics(stepData : StepData) : void {
		super.postPhysics(stepData);

		this._nameTag.model().translation().copyVec(this._profile.pos());
	}
}