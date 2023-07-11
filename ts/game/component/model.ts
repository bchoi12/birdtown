import * as BABYLON from 'babylonjs'

import { game } from 'game'
import { Component, ComponentBase } from 'game/component'
import { ComponentType } from 'game/component/api'
import { Profile } from 'game/component/profile'
import { Entity } from 'game/entity'
import { AnimationHandler } from 'game/util/animation_handler'

import { GameData, DataFilter } from 'game/game_data'

import { defined } from 'util/common'

type MeshFn = (model : Model) => void;
type OnLoadFn = (model : Model) => void;
type PreRenderFn = (model : Model) => void;

type MeshOptions = {
	meshFn : MeshFn;

	readyFn? : () => boolean;
	preRenderFn? : PreRenderFn;
}

export class Model extends ComponentBase implements Component {

	private _readyFn : () => boolean;
	private _onLoadFns : Array<OnLoadFn>;

	private _meshFn : MeshFn;
	private _preRenderFn : PreRenderFn;

	// TODO: multi mesh support
	private _mesh : BABYLON.Mesh;
	private _animationHandler : AnimationHandler
	private _bones : Map<string, BABYLON.Bone>;

	constructor(options : MeshOptions) {
		super(ComponentType.MODEL);

		this.setName({ base: "model" });

		this._meshFn = options.meshFn;
		this._onLoadFns = new Array();

		if (defined(options.readyFn)) { this._readyFn = options.readyFn; }
		if (defined(options.preRenderFn)) { this._preRenderFn = options.preRenderFn; }
	}

	override ready() : boolean {
		return super.ready() && (!defined(this._readyFn) || this._readyFn());
	}

	override initialize() : void {
		super.initialize();
		this._meshFn(this);
	}

	override dispose() : void {
		super.dispose();

		this.onLoad((model : Model) => {
			model.mesh().dispose();
		});
	}

	hasMesh() : boolean { return defined(this._mesh); }
	setMesh(mesh : BABYLON.Mesh) {
		this._mesh = mesh;
		this._mesh.name = this.entity().name();
		this._mesh.metadata = {
			entityId: this.entity().id(),
		};

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

	registerAnimation(animation : BABYLON.AnimationGroup, group? : number) {
		if (!defined(this._animationHandler)) {
			this._animationHandler = new AnimationHandler();
		}

		this._animationHandler.register(animation, group);
	}

	playAnimation(name : string, loop? : boolean) : void {
		if (!defined(this._animationHandler)) {
			console.error("Error: tried to play animation before handler was initialized")
			return;
		}

		this._animationHandler.play(name, loop);
	}

	stopAllAnimations() : void {
		this._animationHandler.stopAll();
	}

	registerBone(bone : BABYLON.Bone) {
		if (!defined(this._bones)) {
			this._bones = new Map();
		}

		this._bones.set(bone.name, bone);
	}

	hasBone(name : string) : boolean {
		if (!defined(this._bones)) {
			return false;
		}

		return this._bones.has(name);
	}
	getBone(name : string) : BABYLON.Bone {
		if (!defined(this._bones)) {
			return null;
		}
		return this._bones.get(name);
	}

	copyProfile(profile : Profile) : void {
		this._mesh.position.x = profile.pos().x;
		this._mesh.position.y = profile.pos().y;

		if (profile.hasAngle()) {
			this._mesh.rotation.z = profile.angle();
		}

		if (profile.hasScaling()) {
			this._mesh.scaling.x = profile.scaling().x;
			this._mesh.scaling.y = profile.scaling().y;
		}
	}

	override preRender(millis : number) : void {
		super.preRender(millis);

		if (!this.hasMesh()) {
			return;
		}

		if (this.entity().hasComponent(ComponentType.PROFILE)) {
			this.copyProfile(this.entity().getComponent<Profile>(ComponentType.PROFILE));
		}

		if (defined(this._preRenderFn)) {
			this._preRenderFn(this);
		}
	}
}