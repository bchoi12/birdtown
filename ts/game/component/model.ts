import * as BABYLON from '@babylonjs/core/Legacy/legacy'

import { game } from 'game'
import { GameObjectState } from 'game/api'
import { StepData } from 'game/game_object'
import { Component, ComponentBase } from 'game/component'
import { ComponentType } from 'game/component/api'
import { Profile } from 'game/component/profile'
import { Entity } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { MaterialType } from 'game/factory/api'
import { MaterialFactory } from 'game/factory/material_factory'
import { AnimationController, PlayOptions } from 'game/util/animation_controller'
import { Transforms, TransformOptions } from 'game/util/transforms'

import { GameData, DataFilter } from 'game/game_data'

import { Optional } from 'util/optional'
import { Vec, Vec3 } from 'util/vector'

type MeshFn = (model : Model) => void;
type OnLoadFn = (model : Model) => void;
type ReadyFn = (model : Model) => boolean;

export type ModelInitOptions = {
	disableShadows? : boolean;
	transforms? : TransformOptions;
	materialType? : MaterialType;
}

type ModelOptions = {
	meshFn : MeshFn;
	readyFn? : ReadyFn;
	init? : ModelInitOptions;
}

export class Model extends ComponentBase implements Component {

	private _options : ModelOptions;
	private _onLoadFns : Array<OnLoadFn>;
	private _animationController : AnimationController;
	private _bones : Map<string, BABYLON.Bone>;

	private _root : BABYLON.TransformNode;
	private _transforms : Transforms;
	private _materialType : Optional<MaterialType>;

	private _mesh : BABYLON.Mesh;
	private _subMesh : Map<number, BABYLON.Mesh>;

	constructor(options : ModelOptions) {
		super(ComponentType.MODEL);

		this._options = options;
		this._onLoadFns = new Array();
		this._animationController = new AnimationController();
		this._bones = new Map();

		this._root = new BABYLON.TransformNode("root");
		this._transforms = new Transforms();
		this._materialType = new Optional();

		this._mesh = null;
		this._subMesh = new Map();

		if (options.init) {
			this._transforms.setFromOptions(options.init.transforms);

			if (options.init.materialType) {
				this._materialType.set(options.init.materialType);
			}
		}

		this.addProp<Vec>({
			has: () => { return this._transforms.hasTranslation(); },
			export: () => { return this._transforms.translation().toVec(); },
			import: (obj : Vec) => { return this._transforms.setTranslation(obj); },
		});
		this.addProp<Vec>({
			has: () => { return this._transforms.hasRotation(); },
			export: () => { return this._transforms.rotation().toVec(); },
			import: (obj : Vec) => { return this._transforms.setRotation(obj); },
		});
		this.addProp<Vec>({
			has: () => { return this._transforms.hasScaling(); },
			export: () => { return this._transforms.scaling().toVec(); },
			import: (obj : Vec) => { return this._transforms.setScaling(obj); },
		});
		this.addProp<MaterialType>({
			has: () => { return this._materialType.has(); },
			export: () => { return this._materialType.get(); },
			import: (obj : MaterialType) => { this._materialType.set(obj); },
		})
	}

	override ready() : boolean {
		return super.ready() && (!this._options.readyFn || this._options.readyFn(this));
	}

	override initialize() : void {
		super.initialize();

		this._root.name = this.entity().name() + "-root";

		this._options.meshFn(this);

		if (!this._options.init || !this._options.init.disableShadows) {
			this.onLoad((loaded : Model) => {
				game.world().renderShadows(loaded.mesh());
			});
		}
	}

	override setState(state : GameObjectState) : void {
		super.setState(state);

		this.setVisible(state !== GameObjectState.DEACTIVATED);
	}

	override dispose() : void {
		super.dispose();

		this._root.dispose();

		if (this.hasMesh()) {
			this.mesh().dispose();
		}
	}

	hasMaterialType() : boolean { return this._materialType.has(); }
	materialType() : MaterialType { return this._materialType.get(); }

	transforms() : Transforms { return this._transforms; }
	hasTranslation() : boolean { return this._transforms.hasTranslation(); }
	translation() : Vec3 { return this._transforms.translation(); }
	hasRotation() : boolean { return this._transforms.hasRotation(); }
	rotation() : Vec3 { return this._transforms.rotation(); }
	hasScaling() : boolean { return this._transforms.hasScaling() ; }
	scaling() : Vec3 { return this._transforms.scaling(); }

	root() : BABYLON.TransformNode { return this._root; }
	hasMesh() : boolean { return this._mesh !== null; }
	setMesh(mesh : BABYLON.Mesh) {
		this._mesh = mesh;
		this._mesh.name = this.entity().name();
		this.applyToMeshes((mesh : BABYLON.Mesh) => {
			mesh.metadata = {
				entityId: this.entity().id(),
			};
		});
		if (this._materialType.has()) {
			mesh.material = MaterialFactory.material(this._materialType.get());
		}

		if (this._mesh.parent === null) {
			this._mesh.parent = this._root;
		}

		this._onLoadFns.forEach((fn : OnLoadFn) => {
			if (this._mesh.isReady()) {
				fn(this);
			} else {
				this._mesh.onMeshReadyObservable.addOnce(() => {
					fn(this);
				});
			}
		});
		this._onLoadFns = [];
	}
	mesh() : BABYLON.Mesh { return this._mesh; }

	registerSubMesh(id : number, subMesh : BABYLON.Mesh) : void {
		if (this._subMesh.has(id)) {
			console.error("Warning: overwriting mesh with ID %d in %s", id, this.name());
		}
		subMesh.parent = this._root;
		this._subMesh.set(id, subMesh);
	}
	subMesh(id : number) : BABYLON.Mesh { return this._subMesh.get(id); }

	onLoad(fn : OnLoadFn) : void {
		if (this.hasMesh()) {
			if (this._mesh.isReady()) {
				fn(this);
			} else {
				this._mesh.onMeshReadyObservable.addOnce(() => {
					fn(this);
				});
			}
		} else {
			this._onLoadFns.push(fn);
		}
	}
	applyToMeshes(fn : (mesh : BABYLON.Mesh) => void) : void {
		this.onLoad((model : Model) => {
			fn(model.mesh());
			model.mesh().getChildMeshes<BABYLON.Mesh>().forEach((child : BABYLON.Mesh) => {
				fn(child);
			});

			this._subMesh.forEach((mesh : BABYLON.Mesh) => {
				fn(mesh);
				mesh.getChildMeshes<BABYLON.Mesh>().forEach((child : BABYLON.Mesh) => {
					fn(child);
				});
			});
		});
	}
	setVisible(visible : boolean) : void {
		this.applyToMeshes((mesh : BABYLON.Mesh) => { mesh.isVisible = visible; });
	}

	registerAnimation(animation : BABYLON.AnimationGroup, group? : number) { this._animationController.register(animation, group); }
	playAnimation(name : string, options? : PlayOptions) : void { this._animationController.play(name, options); }
	stopAllAnimations() : void { this._animationController.stopAll(); }

	registerBone(bone : BABYLON.Bone) { this._bones.set(bone.name, bone); }
	hasBone(name : string) : boolean { return this._bones.has(name); }
	getBone(name : string) : BABYLON.Bone { return this._bones.get(name); }

	resetTransforms() : void {
		const translation = this.translation();
		this._root.position.set(translation.x, translation.y, translation.z);

		const rotation = this.rotation();
		this._root.rotation.set(rotation.x, rotation.y, rotation.z);

		const scaling = this.scaling();
		this._root.scaling.set(scaling.x, scaling.y, scaling.z);
	}
	private addProfileTransforms(profile : Profile) : void {
		const useRenderPos = game.level().isCircle() && this._root.parent === null;
		let pos = useRenderPos ? profile.getRenderPos() : profile.pos();

		this._root.position.x += pos.x;
		this._root.position.y += pos.y;

		if (profile.hasAngle()) {
			this._root.rotation.z += profile.angle();
		}

		this._root.scaling.x *= profile.scaling().x;
		this._root.scaling.y *= profile.scaling().y;
	}

	override preRender() : void {
		super.preRender();

		if (!this.hasMesh()) {
			return;
		}

		this.resetTransforms();
		if (this.entity().hasProfile()) {
			this.addProfileTransforms(this.entity().profile());
		}
	}
}