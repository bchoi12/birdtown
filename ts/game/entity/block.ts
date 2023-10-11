import * as BABYLON from '@babylonjs/core/Legacy/legacy'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { StepData } from 'game/game_object'
import { ColorFactory, ColorType } from 'game/factory/color_factory'
import { CardinalType } from 'game/factory/cardinal_factory'
import { ComponentType, ShadowType } from 'game/component/api'
import { Cardinals } from 'game/component/cardinals'
import { EntityTrackers } from 'game/component/entity_trackers'
import { HexColors } from 'game/component/hex_colors'
import { Model } from 'game/component/model'
import { Profile } from 'game/component/profile'
import { Entity, EntityBase, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { MeshType } from 'game/factory/api'
import { BodyFactory } from 'game/factory/body_factory'
import { MeshFactory, LoadResult } from 'game/factory/mesh_factory'

import { Cardinal, CardinalDir } from 'util/cardinal'
import { defined } from 'util/common'
import { HexColor } from 'util/hex_color'
import { Optional } from 'util/optional'
import { Vec, Vec2 } from 'util/vector'

enum MaterialProp {
	UNKNOWN = "",
	BASE = "base",
	SECONDARY = "secondary",
	FRONT = "front",
	BACK = "back",
	TRANSPARENT = "transparent",
}

enum MeshProp {
	UNKNOWN = "",
	BACK = "back",
	OPENING = "opening",
	WINDOWS = "windows",
}

type CachedMaterial = {
	material : BABYLON.Material;
	alpha : number;
}
type MaterialFn = (material : BABYLON.StandardMaterial) => void;

export abstract class Block extends EntityBase {

	protected static readonly _minOpacity = 0.1;
	protected static readonly _transitionMillis = 300;
	protected static readonly _minPenetrationSq = 0.1;
	protected static readonly _backColorScale = 0.7;
	protected static readonly _transparentAlpha = 0.5;

	protected _transparent : boolean;
	protected _materialCache : Map<string, CachedMaterial>;
	protected _frontMaterials : Set<string>
	protected _transparentFrontMeshes : Array<BABYLON.Mesh>;

	protected _cardinals : Cardinals;
	protected _entityTrackers : EntityTrackers;
	protected _hexColors : HexColors;
	protected _profile : Profile;
	protected _model : Model;

	constructor(type : EntityType, entityOptions : EntityOptions) {
		super(type, entityOptions);

		this.addType(EntityType.BLOCK);
		this.addNameParams({
			base: "block",
			id: this.id(),
		});

		this._transparent = false;

		this._materialCache = new Map();
		this._frontMaterials = new Set();
		this._transparentFrontMeshes = new Array();

		this._cardinals = this.addComponent<Cardinals>(new Cardinals(entityOptions.cardinalsInit));
		this._entityTrackers = this.addComponent<EntityTrackers>(new EntityTrackers());
		this._hexColors = this.addComponent<HexColors>(new HexColors(entityOptions.hexColorsInit));

		this._profile = this.addComponent<Profile>(new Profile({
			bodyFn: (profile : Profile) => {
				return BodyFactory.rectangle(profile.pos(), profile.dim(), {
					isSensor: true,
					isStatic: true,
					collisionFilter: {
						group: BodyFactory.ignoreWallGroup,
					},
					render: {
						visible: false,
					},
				});
			},
			init: entityOptions.profileInit,
		}));

		this._model = this.addComponent(new Model({
			readyFn: () => {
				return this._profile.ready();
			},
			meshFn: (model : Model) => {
				MeshFactory.load(this.meshType(), (result : LoadResult) => {
					let mesh = <BABYLON.Mesh>result.meshes[0];
					mesh.position = this._profile.pos().clone().sub({y: this._profile.dim().y / 2}).toBabylon3();

					this.processMesh(mesh);
					model.setMesh(mesh);
					model.setOffset({y: -this._profile.dim().y / 2});
				});
			},
		}));
	}

	abstract meshType() : MeshType;
	abstract thickness() : number;

	hasOpenings() : boolean { return this._cardinals.hasCardinal(CardinalType.OPENINGS); }
	openings() : Cardinal { return this._cardinals.getCardinal(CardinalType.OPENINGS); }
	transparent() : boolean { return this._transparent; }

	override prePhysics(stepData : StepData) : void {
		super.prePhysics(stepData);

		this._transparent = false;
	}

	override collide(collision : MATTER.Collision, other : Entity) : void {
		super.collide(collision, other);

		if (!game.lakitu().hasTargetEntity()) {
			return;
		}

		const target = game.lakitu().targetEntity();
		if (target.id() !== other.id() || !target.hasProfile()) {
			return;
		}

		const targetProfile = target.getProfile();
		const feet = targetProfile.pos().clone().sub({y: targetProfile.dim().y / 2});
		if (!this._profile.contains(feet)) {
			return;
		}

		this._transparent = true;
	}

	override postPhysics(stepData : StepData) : void {
		super.postPhysics(stepData);
		const millis = stepData.millis;

		if (this.transparent()) {
			this._frontMaterials.forEach((name : string) => {
				const cached = this._materialCache.get(name);
				cached.material.alpha = Math.max(Block._minOpacity, cached.material.alpha - millis / Block._transitionMillis);
			});
			this._transparentFrontMeshes.forEach((mesh : BABYLON.Mesh) => {
				mesh.isVisible = false;
			});
		} else {
			this._frontMaterials.forEach((name : string) => {
				const cached = this._materialCache.get(name);
				cached.material.alpha = Math.min(cached.alpha, cached.material.alpha + millis / Block._transitionMillis);
			});
			this._transparentFrontMeshes.forEach((mesh : BABYLON.Mesh) => {
				mesh.isVisible = true;
			});
		}
	}

	protected addTrackedEntity<T extends Entity>(type : EntityType, options : EntityOptions) : [T, boolean] {
		const [entity, hasEntity] = this.addEntity<T>(type, options);
		if (hasEntity) {
			this._entityTrackers.trackEntity(type, entity);
		}
		return [entity, hasEntity];
	}

	protected processMesh(mesh : BABYLON.Mesh) : void {
		mesh.getChildMeshes().forEach((child : BABYLON.Mesh) => {
			this.processMesh(child);
		});

		if (!defined(mesh.material)) {
			return;
		}

		let meshProps = new Set<string>();
		mesh.name.split("-").forEach((prop : string) => {
			meshProps.add(prop.split("_")[0]);
		});

		if (meshProps.has(MeshProp.OPENING)) {
			if (!this.hasOpenings()) {
				console.error("Error: object %s does not have openings cardinal", this.name());
			} else if (this.openings().nameMatches(meshProps).size > 0) {
				mesh.isVisible = false;
			}
		}

		if (meshProps.has(MeshProp.WINDOWS)) {
			this._transparentFrontMeshes.push(mesh);
			game.world().excludeHighlight(mesh, true);
		}

		if (this._materialCache.has(mesh.material.name)) {
			mesh.material = this._materialCache.get(mesh.material.name).material;
			return;
		}

		let materialProps = new Set<string>(mesh.material.name.split("-"));

		let newMaterial = new BABYLON.StandardMaterial(mesh.material.name, game.scene());
		newMaterial.sideOrientation = mesh.material.sideOrientation;
		newMaterial.backFaceCulling = true;

		let diffuse = new Optional<HexColor>();
		if (materialProps.has(MaterialProp.BASE)) {
			if (!this._hexColors.hasColor(ColorType.BASE)) {
				console.error("Warning: missing base color for %s", this.name());
			} else {
				diffuse.set(this._hexColors.getColor(ColorType.BASE));
			}
		} else if (materialProps.has(MaterialProp.SECONDARY)) {
			if (!this._hexColors.hasColor(ColorType.SECONDARY)) {
				console.error("Warning: missing secondary color for %s", this.name());
			} else {
				diffuse.set(this._hexColors.getColor(ColorType.SECONDARY));
			}
		} else if (meshProps.has(MeshProp.WINDOWS)) {
			diffuse.set(ColorFactory.transparentWindow);
		}

		if (diffuse.has()) {
			if (materialProps.has(MaterialProp.BACK)) {
				diffuse.set(diffuse.get().clone().mult(Block._backColorScale));
			}
			newMaterial.diffuseColor = diffuse.get().toBabylonColor3();
		}


		if (materialProps.has(MaterialProp.TRANSPARENT)) {
			newMaterial.alpha = Block._transparentAlpha;
			newMaterial.needDepthPrePass = true;
		}

		if (materialProps.has(MaterialProp.FRONT)) {
			this._frontMaterials.add(newMaterial.name);
			newMaterial.needDepthPrePass = true;
		}

		this._materialCache.set(newMaterial.name, {
			material: newMaterial,
			alpha: newMaterial.alpha,
		});
		mesh.material = newMaterial;
	}
}