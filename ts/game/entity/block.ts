import * as BABYLON from 'babylonjs'
import 'babylonjs-materials'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { ComponentType } from 'game/component'
import { Attribute, Attributes } from 'game/component/attributes'
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

export class Block extends EntityBase {

	private _baseColor : HexColor;
	private _secondaryColor : HexColor;
	private _openings : Cardinal;
	private _transparent : boolean;

	// TODO: expand cache value to be struct
	private _materialCache : Map<string, BABYLON.Material>;
	private _frontMaterials : Map<BABYLON.Material, number>;
	private _windows : BABYLON.Mesh;

	private _attributes : Attributes;
	private _profile : Profile;
	private _model : Model;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.BLOCK, entityOptions);

		this.setName({
			base: "block",
			id: this.id(),
		});

		this._baseColor = new HexColor(0xff0000);
		this._secondaryColor = new HexColor(0xffffff);
		this._openings = Cardinal.fromTypes([CardinalType.LEFT, CardinalType.RIGHT]);
		this._transparent = false;

		this._materialCache = new Map();
		this._frontMaterials = new Map();

		this._attributes = this.addComponent<Attributes>(new Attributes(entityOptions.attributesInit));

		const collisionGroup = MATTER.Body.nextGroup(true);
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
		this._profile.setDim({x: 12, y: 6});

		this.addComponent(new Model({
			readyFn: () => {
				return this._profile.ready();
			},
			meshFn: (model : Model) => {
				loader.load(ModelType.ARCH_BASE, (result : LoadResult) => {
					let root = <BABYLON.Mesh>result.meshes[0];
					root.name = this.name();
					root.position = this._profile.pos().clone().sub({y: this._profile.dim().y / 2}).toBabylon3();

					this.processMesh(root);
					model.setMesh(root);
				});
			},
		}));
	}

	thickness() : number { return 0.5; }

	override initialize() : void {
		super.initialize();

		if (!this._openings.anyBottom()) {
			game.entities().addEntity(EntityType.WALL, {
				profileInit: this._profile.createRelativeInit(CardinalType.BOTTOM, {x: this._profile.dim().x, y: this.thickness() }),
			});
		} else {
			if (!this._openings.hasType(CardinalType.BOTTOM_LEFT)) {
				game.entities().addEntity(EntityType.WALL, {
					profileInit: this._profile.createRelativeInit(CardinalType.BOTTOM_LEFT, {x: this._profile.dim().x / 2, y: this.thickness() }),
				});
				game.entities().addEntity(EntityType.WALL, {
					profileInit: this._profile.createRelativeInit(CardinalType.BOTTOM_LEFT, {x: this.thickness(), y: this.thickness() }),
				});
			}
			if (!this._openings.hasType(CardinalType.BOTTOM_RIGHT)) {
				game.entities().addEntity(EntityType.WALL, {
					profileInit: this._profile.createRelativeInit(CardinalType.BOTTOM_RIGHT, {x: this._profile.dim().x / 2, y: this.thickness() }),
				});
				game.entities().addEntity(EntityType.WALL, {
					profileInit: this._profile.createRelativeInit(CardinalType.BOTTOM_RIGHT, {x: this.thickness(), y: this.thickness() }),
				});
			}
		}

		if (this._openings.hasType(CardinalType.RIGHT)) {
			game.entities().addEntity(EntityType.WALL, {
				profileInit: this._profile.createRelativeInit(CardinalType.TOP_RIGHT, {x: this.thickness(), y: 1.5 }),
			});
		} else {
			game.entities().addEntity(EntityType.WALL, {
				profileInit: this._profile.createRelativeInit(CardinalType.RIGHT, {x: this.thickness(), y: this._profile.dim().y }),
			});
		}

		if (this._openings.hasType(CardinalType.LEFT)) {
			game.entities().addEntity(EntityType.WALL, {
				profileInit: this._profile.createRelativeInit(CardinalType.TOP_LEFT, {x: this.thickness(), y: 1.5 }),
			});
		} else {
			game.entities().addEntity(EntityType.WALL, {
				profileInit: this._profile.createRelativeInit(CardinalType.LEFT, {x: this.thickness(), y: this._profile.dim().y }),
			});
		}
	}

	override preUpdate(millis : number) : void {
		super.preUpdate(millis);

		this._transparent = false;
	}

	override preRender(millis : number) : void {
		super.update(millis);

		if (this._transparent) {
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

		if (Vec2.fromVec(collision.penetration).lengthSq() < 0.25) {
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
			if (this._openings.nameMatches(meshProps).size > 0) {
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