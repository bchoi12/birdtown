import * as BABYLON from 'babylonjs'

import { game } from 'game'
import { Component, ComponentBase, ComponentType } from 'game/component'
import { Profile } from 'game/component/profile'
import { Entity } from 'game/entity'
import { AnimationHandler } from 'game/util/animation_handler'

import { Data, DataFilter, DataMap } from 'network/data'

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
	private _meshFn : MeshFn;
	private _preRenderFn : PreRenderFn;
	private _onLoadFns : Array<OnLoadFn>;

	// TODO: multi mesh support
	private _mesh : BABYLON.Mesh;
	private _animationHandler : AnimationHandler
	private _bones : Map<string, BABYLON.Bone>;

	constructor(options : MeshOptions) {
		super(ComponentType.MODEL);

		this.setName({ base: "model" });

		this._meshFn = options.meshFn;
		if (defined(options.readyFn)) { this._readyFn = options.readyFn; }
		if (defined(options.preRenderFn)) { this._preRenderFn = options.preRenderFn; }
		this._onLoadFns = new Array();
	}

	override ready() : boolean {
		return super.ready() && this.hasEntity() && (!defined(this._readyFn) || this._readyFn());
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

		this._onLoadFns.forEach((fn : OnLoadFn) => {
			fn(this);
		});
		this._onLoadFns = [];
	}
	mesh() : BABYLON.Mesh { return this._mesh; }

	onLoad(fn : OnLoadFn) : void {
		if (this.hasMesh()) {
			fn(this);
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