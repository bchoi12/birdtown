import * as BABYLON from '@babylonjs/core/Legacy/legacy'

import { game } from 'game'
import { StepData } from 'game/game_object'
import { AttributeType, ComponentType } from 'game/component/api'
import { Attributes } from 'game/component/attributes'
import { Model } from 'game/component/model'
import { Profile } from 'game/component/profile'
import { Entity, EntityOptions, EquipEntity, InteractEntity } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Equip } from 'game/entity/equip'
import { NameTag } from 'game/entity/equip/name_tag'
import { Interactable } from 'game/entity/interactable'
import { Player } from 'game/entity/player'
import { CollisionCategory, ColorType, MaterialType, MeshType, SoundType } from 'game/factory/api'
import { BodyFactory } from 'game/factory/body_factory'
import { ColorFactory } from 'game/factory/color_factory'
import { EntityFactory } from 'game/factory/entity_factory'
import { MeshFactory, LoadResult } from 'game/factory/mesh_factory'
import { SoundFactory } from 'game/factory/sound_factory'

import { GameGlobals } from 'global/game_globals'

import { settings } from 'settings'

import { StringFactory } from 'strings/string_factory'

import { ui } from 'ui'
import { KeyType, TooltipType } from 'ui/api'
import { KeyNames } from 'ui/common/key_names'

import { CardinalDir } from 'util/cardinal'
import { Fns } from 'util/fns'
import { Timer } from 'util/timer'

export class Table extends Interactable implements Entity, EquipEntity, InteractEntity {

	private static readonly _degPerSecond = 360;
	private static readonly _interactLockout = 400;

	private static readonly _maxSpeed = 1;
	private static readonly _minSpeed = 5e-2;

	private _dir : number;
	private _target : number;
	private _turnTimer : Timer;
	private _nameTag : NameTag;

	private _attributes : Attributes;
	private _model : Model;
	private _profile : Profile;
	private _subProfile : Profile;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.TABLE, entityOptions);

		this._dir = 0;
		this._target = 0;
		this._turnTimer = this.newTimer({
			canInterrupt: false,
		});
		this._nameTag = null;

		this.addProp<number>({
			export: () => { return this._dir; },
			import: (obj : number) => { this.setDir(obj); },
		});
		this.addProp<number>({
			export: () => { return this._target; },
			import: (obj : number) => { this._target = obj; },
		});

		this._attributes = this.addComponent<Attributes>(new Attributes(entityOptions.attributesInit));
		this._attributes.setAttribute(AttributeType.SOLID, true);

		this._model = this.addComponent<Model>(new Model({
			readyFn: () => { return this._profile.ready(); },
			meshFn: (model : Model) => {
				MeshFactory.load(MeshType.TABLE, (result : LoadResult) => {
					model.setMesh(result.mesh);
				});
			},
			init: entityOptions.modelInit,
		}));

		this._profile = this.addComponent<Profile>(new Profile({
			bodyFn: (profile : Profile) => {
				return BodyFactory.rectangle(profile.pos(), profile.initDim(), {
					collisionFilter: BodyFactory.collisionFilter(CollisionCategory.TABLE_FRAME),
					chamfer: {
						radius: 0.1,
					}
				});
			},
			init: entityOptions.profileInit,
		}));
		this._profile.setLimitFn((profile : Profile) => {
			profile.capSpeed(Table._maxSpeed);
			if (Math.abs(profile.vel().x) < Table._minSpeed) {
				profile.vel().x = 0;
			}
		});
		this._profile.setMinimapOptions({
			color: ColorFactory.color(ColorType.TABLE).toString(),
		});

		this._subProfile = this._profile.addSubComponent<Profile>(new Profile({
			bodyFn: (profile : Profile) => {
				let topDim = { x: this._profile.initDim().x, y: 0.5 };
				return BodyFactory.rectangle(this._profile.getRelativePos(CardinalDir.TOP, topDim), topDim, {
					density: BodyFactory.sturdyDensity,
					collisionFilter: BodyFactory.collisionFilter(CollisionCategory.SOLID),
				});
			},
			init: entityOptions.profileInit,
			prePhysicsFn: (profile : Profile) => {
				profile.setAngle(this._profile.angle());
			},
			postPhysicsFn: (profile : Profile) => {
				profile.setAngle(this._profile.angle());
			},
		}));
		this._subProfile.setInertia(Infinity);
		this._subProfile.onBody((subProfile : Profile) => {
			this._profile.onBody((profile : Profile) => {
				profile.setAngle(0);
				subProfile.attachTo(profile, { x: 0, y: 0.35 });

				profile.uprightStop();
				subProfile.uprightStop();
				profile.setAcc({ y: GameGlobals.gravity });
			});
		});

		this._subProfile.setMinimapOptions({
			color: ColorFactory.color(ColorType.TABLE).toString(),
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
		this._nameTag.setDisplayName(KeyNames.boxed(settings.keyCode(KeyType.INTERACT)));
	}

	override delete() : void {
		super.delete();

		if (this._nameTag !== null) {
			this._nameTag.delete();
		}
	}

	override impactSound() : SoundType { return SoundType.WOOD_THUD; }

	setDir(dir : number) : void {
		if (this._dir === dir) {
			return;
		}

		this._dir = dir;
		if (this._dir !== 0) {
			this._turnTimer.start(Table._interactLockout, () => {
				if (!this.deleted()) {
					SoundFactory.playFromEntity(SoundType.TABLE_FLIP, this);
				}
			});
		}
	}

	equip(equip : Equip<Entity & EquipEntity>) : void {
		if (equip.type() !== EntityType.NAME_TAG) {
			console.error("Error: trying to equip %s to %s", equip.name(), this.name());
		}
	}

	override canInteractWith(entity : Entity) : boolean {
		return !this._turnTimer.hasTimeLeft() && super.canInteractWith(entity);
	}

	override setInteractableWith(entity : Entity, interactable : boolean) : void {
		super.setInteractableWith(entity, interactable);

		if (entity.isLakituTarget()) {
			if (this._nameTag !== null) {
				this._nameTag.setVisible(interactable);
			}
		}
	}
	override interactWith(entity : Entity) : void {
		if (entity.type() !== EntityType.PLAYER) {
			return;
		}
		if (!this.canInteractWith(entity)) {
			return;
		}

		this.setDir(entity.profile().pos().x > this._profile.pos().x ? 1 : -1);
		const angle = this._profile.angleDeg() + 90 * this._dir;
		this._target = Fns.normalizeDeg(90 * Math.round(angle / 90))
	}

	override update(stepData : StepData) : void {
		super.update(stepData);
		const millis = stepData.millis;

		if (this._profile.pos().y < game.level().bounds().min.y) {
			this.delete();
		}

		if (!this._turnTimer.hasTimeLeft()) {
			this.setDir(0);
		}

		if (this._dir !== 0) {
			const delta = Table._degPerSecond * millis / 1000;

			if (Math.abs(this._profile.angleDeg() - this._target) < delta) {
				this.setDir(0);

				this._profile.setAngleDeg(this._target);
				this._profile.setAngularVelocity(0);
				this._profile.setVel({x: 0, y: 0});
				this._subProfile.setVel({x: 0, y: 0});
			} else {
				this._profile.addAngleDeg(this._dir * delta);
			}
		}
	}

	override postPhysics(stepData : StepData) : void {
		super.postPhysics(stepData);

		this._nameTag.model().translation().copyVec(this._profile.pos());

		if (this._profile.angleDeg() > 95 && this._profile.angleDeg() < 265) {
			this._nameTag.model().rotation().z = this._profile.angle() - Math.PI;
		} else {
			this._nameTag.model().rotation().z = this._profile.angle();
		}
	}
}