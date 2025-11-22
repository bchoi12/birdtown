import * as BABYLON from '@babylonjs/core/Legacy/legacy'

import { game } from 'game'
import { GameObjectState } from 'game/api'
import { StepData } from 'game/game_object'
import { Component, ComponentBase } from 'game/component'
import { ComponentType } from 'game/component/api'
import { Profile } from 'game/component/profile'
import { Entity } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { ColorType, MaterialType } from 'game/factory/api'
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

	// At most one should be set
	materialType? : MaterialType;
	standardColor? : string;
	staticColor? : string;
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
	private _standardColor : Optional<string>;
	private _staticColor : Optional<string>;
	private _frozen : boolean;
	private _allowWrap : boolean;
	private _lastWrap : Optional<number>;

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
		this._standardColor = new Optional();
		this._staticColor = new Optional();
		this._frozen = false;
		this._allowWrap = true;
		this._lastWrap = new Optional();

		this._mesh = null;
		this._subMesh = new Map();

		if (options.init) {
			this._transforms.setFromOptions(options.init.transforms);

			if (options.init.materialType) {
				this._materialType.set(options.init.materialType);
			} else if (options.init.standardColor) {
				this._standardColor.set(options.init.standardColor);
			} else if (options.init.staticColor) {
				this._staticColor.set(options.init.staticColor);
			}
		}

		this.addProp<MaterialType>({
			has: () => { return this._materialType.has(); },
			export: () => { return this._materialType.get(); },
			import: (obj : MaterialType) => { this._materialType.set(obj); },
		});

		this.addProp<string>({
			has: () => { return this._standardColor.has(); },
			export: () => { return this._standardColor.get(); },
			import: (obj : string) => { this._standardColor.set(obj); },
		});

		this.addProp<string>({
			has: () => { return this._staticColor.has(); },
			export: () => { return this._staticColor.get(); },
			import: (obj : string) => { this._staticColor.set(obj); },
		});

		this.addProp<number>({
			has: () => { return this.hasTranslation() && this.translation().z !== 0; },
			export: () => { return this.translation().z; },
			import: (obj : number) => { this.translation().z = obj; },
		})
	}

	override ready() : boolean {
		return super.ready() && (!this._options.readyFn || this._options.readyFn(this));
	}

	override initialize() : void {
		super.initialize();

		this._root.name = this.entity().name() + "-root";

		if (!this._options.init || !this._options.init.disableShadows) {
			this.onLoad((loaded : Model) => {
				game.world().renderShadows(loaded.mesh());
			});
		}

		this._options.meshFn(this);
	}

	override setState(state : GameObjectState) : void {
		super.setState(state);

		this.setVisible(state !== GameObjectState.DEACTIVATED);
	}

	override dispose() : void {
		super.dispose();

		this._root.dispose();

		this.onLoad((model : Model) => {
			model.mesh().dispose();
		});
	}

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
		} else if (this._standardColor.has()) {
			mesh.material = MaterialFactory.standardColorHex(this._standardColor.get());
		} else if (this._staticColor.has()) {
			mesh.material = MaterialFactory.staticColorHex(this._staticColor.get());
		}

		if (this._mesh.parent === null) {
			this._mesh.parent = this._root;
		}

		if (this._mesh.isReady()) {
			this.executeOnLoad();
		} else {
			this._mesh.onReady = () => {
				this.executeOnLoad();
			};
		}
	}
	mesh() : BABYLON.Mesh { return this._mesh; }
	material<T extends BABYLON.Material>() : T { return <T>this._mesh.material; }
	hasMaterialType() : boolean { return this._materialType.has(); }
	materialType() : MaterialType { return this._materialType.get(); }

	addSubMesh(subMesh : BABYLON.Mesh) : void {
		this.registerSubMesh(this._subMesh.size + 1, subMesh);
	}
	registerSubMesh(id : number, subMesh : BABYLON.Mesh) : void {
		if (this._subMesh.has(id)) {
			console.error("Warning: overwriting mesh with ID %d in %s", id, this.name());
		}
		subMesh.parent = this._root;
		this._subMesh.set(id, subMesh);
	}
	subMesh(id : number) : BABYLON.Mesh { return this._subMesh.get(id); }

	onLoad(fn : OnLoadFn) : void {
		if (this.hasMesh() && this._mesh.isReady()) {
			fn(this);
		} else {
			this._onLoadFns.push(fn);
		}
	}
	private executeOnLoad() : void {
		this._onLoadFns.forEach((fn : OnLoadFn) => {
			fn(this);
		});
		this._onLoadFns = [];
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
	setFrozen(frozen : boolean) : void {
		this._frozen = frozen;
		this.applyFrozen(frozen);
	}
	private applyFrozen(frozen : boolean) : void {
		this.applyToMeshes((mesh : BABYLON.Mesh) => {
			if (frozen) {
				mesh.freezeWorldMatrix();
			} else {
				mesh.unfreezeWorldMatrix();
			}
		});
	}
	setAllowWrap(wrap : boolean) : void {
		this._allowWrap = wrap;
	}

	registerAnimation(animation : BABYLON.AnimationGroup, group? : number) { this._animationController.register(animation, group); }
	playAnimation(name : string, options? : PlayOptions) : void { this._animationController.play(name, options); }
	stopAllAnimations() : void { this._animationController.stopAll(); }

	registerBone(bone : BABYLON.Bone) { this._bones.set(bone.name, bone); }
	hasBone(name : string) : boolean { return this._bones.has(name); }
	getBone(name : string) : BABYLON.Bone { return this._bones.get(name); }

	override preRender() : void {
		super.preRender();

		if (!this.hasMesh()) {
			return;
		}

		if (this.entity().hasProfile()) {
			const profile = this.entity().profile();
			if (this._frozen) {
				const wrap = profile.getWrapDir();
				if (!this._lastWrap.has() || this._lastWrap.get() !== wrap) {
					this.applyFrozen(false);
					this._lastWrap.set(wrap);
				} else if (!this._mesh.isWorldMatrixFrozen) {
					this.applyFrozen(true);
					return;
				} else {
					return;
				}
			}
			this.updateTransforms();
			this.applyProfile(profile);
		} else {
			this.updateTransforms();
		}
	}

	private updateTransforms() : void {
		const translation = this.translation();
		this._root.position.set(translation.x, translation.y, translation.z);

		const rotation = this.rotation();
		this._root.rotation.set(rotation.x, rotation.y, rotation.z);

		const scaling = this.scaling();
		this._root.scaling.set(scaling.x, scaling.y, scaling.z);
	}

	private applyProfile(profile : Profile) {
		const useRenderPos = this._allowWrap && game.level().isCircle() && this._root.parent === null;
		const pos = useRenderPos ? profile.getRenderPos() : profile.pos();

		this._root.position.x += pos.x;
		this._root.position.y += pos.y;
		this._root.position.z += pos.z;

		if (profile.hasAngle()) {
			this._root.rotation.z += profile.angle();
		}

		this._root.scaling.x *= profile.scaling().x;
		this._root.scaling.y *= profile.scaling().y;
	}
}