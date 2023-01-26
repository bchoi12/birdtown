import * as BABYLON from 'babylonjs'
import 'babylonjs-materials'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { ComponentType } from 'game/component'
import { Model } from 'game/component/model'
import { Profile } from 'game/component/profile'
import { Entity, EntityBase, EntityOptions, EntityType } from 'game/entity'
import { loader, LoadResult, ModelType } from 'game/loader'
import { BodyCreator } from 'game/util/body_creator'

import { Cardinal, CardinalType } from 'util/cardinal'
import { defined } from 'util/common'
import { HexColor } from 'util/hex_color'
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
	OPENING = "opening",
	WINDOWS = "windows",
}

type MaterialFn = (material : BABYLON.StandardMaterial) => void;

enum Prop {
	UNKNOWN,
	OPENINGS,
}

export abstract class Block extends EntityBase {

	protected _baseColor : HexColor;
	protected _secondaryColor : HexColor;
	protected _openings : Cardinal;
	protected _transparent : boolean;

	// TODO: expand cache value to be struct
	protected _materialCache : Map<string, BABYLON.Material>;
	protected _frontMaterials : Map<BABYLON.Material, number>;
	protected _windows : BABYLON.Mesh;

	protected _profile : Profile;
	private _model : Model;

	constructor(type : EntityType, entityOptions : EntityOptions) {
		super(type, entityOptions);

		this._allTypes.add(EntityType.BLOCK);
		this.setName({
			base: "block",
			id: this.id(),
		});

		this._baseColor = new HexColor(0xff0000);
		this._secondaryColor = new HexColor(0xffffff);
		this._openings = new Cardinal();
		this._transparent = false;

		this._materialCache = new Map();
		this._frontMaterials = new Map();

		this._profile = this.addComponent<Profile>(new Profile({
			bodyFn: (profile : Profile) => {
				return BodyCreator.rectangle(profile.pos(), profile.dim(), {
					isSensor: true,
					isStatic: true,
					collisionFilter: {
						group: BodyCreator.ignoreWallGroup,
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
				loader.load(this.modelType(), (result : LoadResult) => {
					let root = <BABYLON.Mesh>result.meshes[0];
					root.name = this.name();
					root.position = this._profile.pos().clone().sub({y: this._profile.dim().y / 2}).toBabylon3();

					this.processMesh(root);
					model.setMesh(root);
				});
			},
		}));
	}

	abstract modelType() : ModelType;
	abstract thickness() : number;
	openings() : Cardinal { return this._openings; }
	transparent() : boolean { return this._transparent; }

	override preUpdate(millis : number) : void {
		super.preUpdate(millis);

		this._transparent = false;
	}

	override preRender(millis : number) : void {
		super.update(millis);

		if (this.transparent()) {
			this._frontMaterials.forEach((alpha : number, material : BABYLON.Material) => {
				material.alpha = Math.max(0.1, material.alpha - millis / 300);
				if (defined(this._windows)) {
					this._windows.isVisible = false;
				}
			});
		} else {
			this._frontMaterials.forEach((alpha : number, material : BABYLON.Material) => {
				material.alpha = Math.min(alpha, material.alpha + millis / 300);
				if (defined(this._windows)) {
					this._windows.isVisible = true;
				}
			});
		}
	}

	override collide(other : Entity, collision : MATTER.Collision) : void {
		super.collide(other, collision);

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

		if (meshProps.has("opening")) {
			if (this.openings().nameMatches(meshProps).size > 0) {
				mesh.isVisible = false;
			}
		}

		if (meshProps.has("windows")) {
			this._windows = mesh;
		}

		if (this._materialCache.has(mesh.material.name)) {
			mesh.material = this._materialCache.get(mesh.material.name);
			return;
		}

		let materialProps = new Set<string>(mesh.material.name.split("-"));

		let newMaterial = new BABYLON.StandardMaterial(mesh.material.name, game.scene());
		newMaterial.sideOrientation = mesh.material.sideOrientation;
		newMaterial.backFaceCulling = true;

		if (materialProps.has(MaterialProp.BASE)) {
			newMaterial.diffuseColor = this._baseColor.toBabylonColor3();			
		} else if (materialProps.has(MaterialProp.SECONDARY)) {
			newMaterial.diffuseColor = this._secondaryColor.toBabylonColor3();
		}

		if (materialProps.has(MaterialProp.TRANSPARENT)) {
			newMaterial.alpha = 0.5;
			newMaterial.needDepthPrePass = true;
		}

		if (materialProps.has(MaterialProp.FRONT)) {
			this._frontMaterials.set(newMaterial, newMaterial.alpha);
			newMaterial.needDepthPrePass = true;
		}

		this._materialCache.set(mesh.material.name, newMaterial);
		mesh.material = newMaterial;
	}
}