import * as BABYLON from '@babylonjs/core/Legacy/legacy'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { StepData } from 'game/game_object'
import { ColorFactory } from 'game/factory/color_factory'
import { ColorType } from 'game/factory/api'
import { ComponentType, AttributeType } from 'game/component/api'
import { Attributes } from 'game/component/attributes'
import { Cardinals } from 'game/component/cardinals'
import { EntityTrackers } from 'game/component/entity_trackers'
import { HexColors } from 'game/component/hex_colors'
import { Model } from 'game/component/model'
import { Profile } from 'game/component/profile'
import { Entity, EntityBase, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { CollisionCategory, DepthType, MeshType } from 'game/factory/api'
import { BodyFactory } from 'game/factory/body_factory'
import { MeshFactory, LoadResult } from 'game/factory/mesh_factory'

import { Cardinal, CardinalDir, CardinalType } from 'util/cardinal'
import { HexColor } from 'util/hex_color'
import { Optional } from 'util/optional'
import { Vec, Vec2, Vec3 } from 'util/vector'

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

	protected static readonly _minOpacity = 0.15;
	protected static readonly _transitionMillis = 300;
	protected static readonly _minPenetrationSq = 0.1;
	protected static readonly _backColorScale = 0.7;
	protected static readonly _transparentAlpha = 0.5;

	protected _occludedEntities : Set<Entity>;
	protected _transparent : boolean;
	protected _materialCache : Map<string, CachedMaterial>;
	protected _frontMaterials : Set<string>
	protected _transparentFrontMeshes : Array<BABYLON.Mesh>;

	protected _attributes : Attributes;
	protected _cardinals : Cardinals;
	protected _entityTrackers : EntityTrackers;
	protected _hexColors : HexColors;
	protected _profile : Profile;
	protected _model : Model;

	constructor(type : EntityType, entityOptions : EntityOptions) {
		super(type, entityOptions);
		this.addType(EntityType.BLOCK);

		this._occludedEntities = new Set();
		this._transparent = false;
		this._materialCache = new Map();
		this._frontMaterials = new Set();
		this._transparentFrontMeshes = new Array();

		this._attributes = this.addComponent<Attributes>(new Attributes(entityOptions.attributesInit));
		this._cardinals = this.addComponent<Cardinals>(new Cardinals(entityOptions.cardinalsInit));
		this._entityTrackers = this.addComponent<EntityTrackers>(new EntityTrackers());
		this._hexColors = this.addComponent<HexColors>(new HexColors(entityOptions.hexColorsInit));

		this._profile = this.addComponent<Profile>(new Profile({
			bodyFn: (profile : Profile) => {
				return BodyFactory.rectangle(profile.pos(), profile.unscaledDim(), {
					isSensor: true,
					isStatic: true,
					collisionFilter: BodyFactory.collisionFilter(CollisionCategory.INTERACTABLE),
				});
			},
			init: entityOptions.profileInit,
		}));
		this._profile.setVisible(false);

		this._model = this.addComponent(new Model({
			readyFn: () => {
				return this._profile.ready();
			},
			meshFn: (model : Model) => {
				MeshFactory.load(this.meshType(), (result : LoadResult) => {
					let mesh = <BABYLON.Mesh>result.meshes[0];
					this.processMesh(mesh);

					model.translation().copyVec(this.meshOffset());
					model.setMesh(mesh);
				});
			},
			init: entityOptions.modelInit,
		}));
	}

	override initialize() : void {
		super.initialize();

		// Set up minimap rendering after processing mesh
		this._model.onLoad(() => {
			if (this._hexColors.hasColor(ColorType.BASE) && this.canOcclude()) {
				this._profile.setMinimapOptions({
					color: this._hexColors.color(ColorType.BASE).toString(),
					depthType: DepthType.FRONT,
				});
			}
		});
	}

	abstract meshType() : MeshType;
	meshOffset() : Vec { return Vec3.zero(); }
	abstract thickness() : number;

	hasOpenings() : boolean { return this._cardinals.hasCardinal(CardinalType.OPENINGS); }
	openings() : Cardinal { return this._cardinals.getCardinal(CardinalType.OPENINGS); }
	transparent() : boolean { return this._transparent; }

	override prePhysics(stepData : StepData) : void {
		super.prePhysics(stepData);

		this._transparent = false;
		this._occludedEntities.clear();
	}

	override collide(collision : MATTER.Collision, other : Entity) : void {
		super.collide(collision, other);

		if (!this.canOcclude()) {
			return;
		}

		if (this.profile().containsProfile(other.profile())) {
			this._occludedEntities.add(other);
		}

		if (!game.lakitu().validTargetEntity()) {
			return;
		}

		const target = game.lakitu().targetEntity();
		if (target.id() !== other.id() || !target.hasProfile()) {
			return;
		}

		if (!this._profile.contains(target.profile().pos())) {
			return;
		}

		this._transparent = true;
	}

	override postPhysics(stepData : StepData) : void {
		super.postPhysics(stepData);
		const millis = stepData.millis;

		this._profile.setVisible(this.canOcclude() && !this.transparent());
		if (this.transparent()) {
			this._frontMaterials.forEach((name : string) => {
				const cached = this._materialCache.get(name);
				cached.material.alpha = Math.max(Block._minOpacity, cached.material.alpha - millis / Block._transitionMillis);
			});
			this._transparentFrontMeshes.forEach((mesh : BABYLON.Mesh) => {
				mesh.isVisible = false;
			});
		} else {
			this._occludedEntities.forEach((entity : Entity) => {
				entity.profile().setOccluded(true);
			});
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

		if (!mesh.material) { return; }

		if (!(mesh.material instanceof BABYLON.PBRMaterial)) {
			console.error("Error: %s material is not PBRMaterial", this.name(), mesh.material);
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
			game.world().excludeHighlight(mesh);
		}

		if (this._materialCache.has(mesh.material.name)) {
			mesh.material = this._materialCache.get(mesh.material.name).material;
			return;
		}
		// mesh.material.name = this.name() + "_" + mesh.material.name;
		mesh.material.backFaceCulling = true;

		let materialProps = new Set<string>(mesh.material.name.split("-"));
		let diffuse = new Optional<HexColor>();
		if (materialProps.has(MaterialProp.BASE)) {
			if (!this._hexColors.hasColor(ColorType.BASE)) {
				console.error("Warning: missing base color for %s", this.name());
			} else {
				diffuse.set(this._hexColors.color(ColorType.BASE));
			}
		} else if (materialProps.has(MaterialProp.SECONDARY)) {
			if (!this._hexColors.hasColor(ColorType.SECONDARY)) {
				console.error("Warning: missing secondary color for %s", this.name());
			} else {
				diffuse.set(this._hexColors.color(ColorType.SECONDARY));
			}
		} else if (meshProps.has(MeshProp.WINDOWS)) {
			diffuse.set(ColorFactory.transparentWindow);
		}

		if (diffuse.has()) {
			if (materialProps.has(MaterialProp.BACK)) {
				diffuse.set(diffuse.get().clone().mult(Block._backColorScale));
			}
			mesh.material.albedoColor = diffuse.get().toBabylonColor3();
		}


		if (materialProps.has(MaterialProp.TRANSPARENT)) {
			mesh.material.alpha = Block._transparentAlpha;
			mesh.material.transparencyMode = BABYLON.Material.MATERIAL_ALPHABLEND;
			mesh.material.needDepthPrePass = true;
		}

		if (materialProps.has(MaterialProp.FRONT)) {
			this._frontMaterials.add(mesh.material.name);
			mesh.material.transparencyMode = BABYLON.Material.MATERIAL_ALPHABLEND;
			mesh.material.needDepthPrePass = true;
		}

		this._materialCache.set(mesh.material.name, {
			material: mesh.material,
			alpha: mesh.material.alpha,
		});

		mesh.material.markDirty(true);
	}

	protected canOcclude() : boolean { return !(this._frontMaterials.size === 0 && this._transparentFrontMeshes.length === 0); }
}