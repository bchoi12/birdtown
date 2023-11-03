import * as BABYLON from '@babylonjs/core/Legacy/legacy'

import { game } from 'game'
import { GameObjectState } from 'game/api'
import { StepData } from 'game/game_object'
import { Component, ComponentBase } from 'game/component'
import { ComponentType } from 'game/component/api'
import { Profile } from 'game/component/profile'
import { Entity } from 'game/entity'
import { AnimationController } from 'game/util/animation_controller'

import { GameData, DataFilter } from 'game/game_data'

import { Vec, Vec3 } from 'util/vector'

type MeshFn = (model : Model) => void;
type OnLoadFn = (model : Model) => void;
type ReadyFn = (model : Model) => boolean;

type ModelOptions = {
	meshFn : MeshFn;
	
	disableShadows? : boolean;
	readyFn? : ReadyFn;
}

export class Model extends ComponentBase implements Component {

	private _options : ModelOptions;
	private _onLoadFns : Array<OnLoadFn>;
	private _animationController : AnimationController;
	private _bones : Map<string, BABYLON.Bone>;

	private _translation : Vec3;
	private _scaling : Vec3;

	// TODO: multi mesh support
	private _mesh : BABYLON.Mesh;

	constructor(options : ModelOptions) {
		super(ComponentType.MODEL);

		this._options = options;
		this._onLoadFns = new Array();
		this._animationController = new AnimationController();
		this._bones = new Map();

		this._translation = Vec3.zero();
		this._scaling = Vec3.one();

		this._mesh = null;

		this.addProp<Vec>({
			export: () => { return this._translation.toVec(); },
			import: (obj : Vec) => { this._translation.copyVec(obj); },
		});
		this.addProp<Vec>({
			export: () => { return this._scaling.toVec(); },
			import: (obj : Vec) => { this._scaling.copyVec(obj); },
		});
	}

	override ready() : boolean {
		return super.ready() && (this._options.readyFn !== null || this._options.readyFn(this));
	}

	override initialize() : void {
		super.initialize();
		this._options.meshFn(this);

		if (!this._options.disableShadows) {
			this.onLoad((loaded : Model) => {
				game.world().renderShadows(loaded.mesh());
			});
		}
	}

	override setState(state : GameObjectState) : void {
		super.setState(state);

		this.onLoad((model : Model) => {
			model.mesh().isVisible = (state !== GameObjectState.DEACTIVATED);
		});
	}

	override dispose() : void {
		super.dispose();

		this.onLoad((model : Model) => {
			model.mesh().dispose();
		});
	}

	translation() : Vec3 { return this._translation; }
	setTranslation(translation : Vec) : void { this._translation.copyVec(translation); }
	scaling() : Vec3 { return this._scaling; }
	setScaling(scaling : Vec) : void { this._scaling.copyVec(scaling); }

	hasMesh() : boolean { return this._mesh !== null; }
	setMesh(mesh : BABYLON.Mesh) {
		this._mesh = mesh;
		this._mesh.name = this.entity().name();
		this._mesh.metadata = {
			entityId: this.entity().id(),
		};
		this._mesh.getChildMeshes<BABYLON.Mesh>().forEach((child : BABYLON.Mesh) => {
			child.metadata = {
				entityId: this.entity().id(),
			};
		});

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

	registerAnimation(animation : BABYLON.AnimationGroup, group? : number) { this._animationController.register(animation, group); }
	playAnimation(name : string, loop? : boolean) : void { this._animationController.play(name, loop); }
	stopAllAnimations() : void { this._animationController.stopAll(); }

	registerBone(bone : BABYLON.Bone) { this._bones.set(bone.name, bone); }
	hasBone(name : string) : boolean { return this._bones.has(name); }
	getBone(name : string) : BABYLON.Bone { return this._bones.get(name); }

	resetTransforms() : void {
		this._mesh.position.set(this._translation.x, this._translation.y, this._translation.z);
		this._mesh.scaling.set(this._scaling.x, this._scaling.y, this._scaling.z);
	}
	addProfileTransforms(profile : Profile) : void {
		this._mesh.position.x += profile.pos().x;
		this._mesh.position.y += profile.pos().y;

		if (profile.hasAngle()) {
			this._mesh.rotation.z = profile.angle();
		}

		this._mesh.scaling.x *= profile.scaling().x;
		this._mesh.scaling.y *= profile.scaling().y;
	}

	override preRender() : void {
		super.preRender();

		if (!this.hasMesh()) {
			return;
		}

		this.resetTransforms();
		if (this.entity().hasProfile()) {
			this.addProfileTransforms(this.entity().getProfile());
		}
	}
}