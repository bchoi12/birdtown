import * as BABYLON from 'babylonjs'
import 'babylonjs-materials'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { ColorFactory, ColorType } from 'game/factory/color_factory'
import { CardinalType } from 'game/factory/cardinal_factory'
import { ComponentType } from 'game/component'
import { Cardinals } from 'game/component/cardinals'
import { HexColors } from 'game/component/hex_colors'
import { Model } from 'game/component/model'
import { Profile } from 'game/component/profile'
import { Entity, EntityBase, EntityOptions, EntityType } from 'game/entity'
import { loader, LoadResult, MeshType } from 'game/loader'
import { BodyFactory } from 'game/factory/body_factory'

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

	protected _transparent : boolean;
	protected _materialCache : Map<string, CachedMaterial>;
	protected _frontMaterials : Set<string>
	protected _transparentFrontMeshes : Array<BABYLON.Mesh>;

	protected _cardinals : Cardinals;
	protected _hexColors : HexColors;
	protected _profile : Profile;
	protected _model : Model;

	constructor(type : EntityType, entityOptions : EntityOptions) {
		super(type, entityOptions);

		this._allTypes.add(EntityType.BLOCK);
		this.setName({
			base: "block",
			id: this.id(),
		});

		this._transparent = false;

		this._materialCache = new Map();
		this._frontMaterials = new Set();
		this._transparentFrontMeshes = new Array();

		this._cardinals = this.addComponent<Cardinals>(new Cardinals(entityOptions.cardinalsInit));

		this._hexColors = this.addComponent<HexColors>(new HexColors(entityOptions.hexColorsInit));

		this._profile = this.addComponent<Profile>(new Profile({
			bodyFn: (profile : Profile) => {
				return BodyFactory.rectangle(profile.pos(), profile.dim(), {
					isSensor: true,
					isStatic: true,
					collisionFilter: {
						group: BodyFactory.ignoreWallGroup,
					},
				});
			},
			init: entityOptions.profileInit,
		}));

		this.addComponent(new Model({
			readyFn: () => {
				return this._profile.ready();
			},
			meshFn: (model : Model) => {
				loader.load(this.meshType(), (result : LoadResult) => {
					let mesh = <BABYLON.Mesh>result.meshes[0];
					mesh.position = this._profile.pos().clone().sub({y: this._profile.dim().y / 2}).toBabylon3();

					this.processMesh(mesh);
					model.setMesh(mesh);
				});
			},
		}));
	}

	abstract meshType() : MeshType;
	abstract thickness() : number;

	hasOpenings() : boolean { return this._cardinals.hasCardinal(CardinalType.OPENINGS); }
	openings() : Cardinal { return this._cardinals.getCardinal(CardinalType.OPENINGS); }
	transparent() : boolean { return this._transparent; }

	override preUpdate(millis : number) : void {
		super.preUpdate(millis);

		this._transparent = false;
	}

	override preRender(millis : number) : void {
		super.update(millis);

		if (this.transparent()) {
			this._frontMaterials.forEach((name : string) => {
				const cached = this._materialCache.get(name);
				cached.material.alpha = Math.max(0.1, cached.material.alpha - millis / 300);
			});
			this._transparentFrontMeshes.forEach((mesh : BABYLON.Mesh) => {
				mesh.isVisible = false;
			});
		} else {
			this._frontMaterials.forEach((name : string) => {
				const cached = this._materialCache.get(name);
				cached.material.alpha = Math.min(cached.alpha, cached.material.alpha + millis / 300);
			});
			this._transparentFrontMeshes.forEach((mesh : BABYLON.Mesh) => {
				mesh.isVisible = true;
			});
		}
	}

	override collide(collision : MATTER.Collision, other : Entity) : void {
		super.collide(collision, other);

		if (!game.lakitu().hasTargetEntity()) {
			return;
		}

		if (game.lakitu().targetEntity().id() !== other.id()) {
			return;
		}

		if (Vec2.fromVec(collision.penetration).lengthSq() < 0.1) {
			return;
		}

		this._transparent = true;
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
				diffuse.set(diffuse.get().clone().mult(0.8));
			}
			newMaterial.diffuseColor = diffuse.get().toBabylonColor3();
		}


		if (materialProps.has(MaterialProp.TRANSPARENT)) {
			newMaterial.alpha = 0.5;
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