import * as BABYLON from 'babylonjs'

import { game } from 'game'
import { Component, ComponentBase, ComponentType } from 'game/component'
import { Data, DataFilter, DataMap } from 'game/data'
import { Entity } from 'game/entity'
import { AnimationHandler } from 'game/util/animation_handler'

import { defined } from 'util/common'

type MeshFn = (mesh : Mesh) => void;
type OnLoadFn = (mesh : Mesh) => void;

type MeshOptions = {
	readyFn? : () => boolean;
	meshFn : MeshFn;
}

export class Mesh extends ComponentBase implements Component {

	private _readyFn : () => boolean;
	private _meshFn : MeshFn;
	private _onLoadFns : Array<OnLoadFn>;

	private _mesh : BABYLON.Mesh;
	private _animationHandler : AnimationHandler
	private _bones : Map<string, BABYLON.Bone>;

	constructor(options : MeshOptions) {
		super(ComponentType.MESH);

		if (defined(options.readyFn)) {
			this._readyFn = options.readyFn;
		}
		this._meshFn = options.meshFn;
		this._onLoadFns = new Array();
	}

	override ready() : boolean {
		return this.hasEntity() && (!defined(this._readyFn) || this._readyFn());
	}

	override initialize() : void {
		super.initialize();
		this._meshFn(this);
	}

	override delete() : void {
		if (this.hasMesh()) {
			this._mesh.dispose();
		}
	}

	hasMesh() : boolean { return defined(this._mesh); }
	setMesh(mesh : BABYLON.Mesh) {
		this._mesh = mesh;

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

	override preRender() : void {
		super.preRender();

		if (!this.hasMesh()) {
			return;
		}

		let profile = this.entity().profile();
		if (defined(profile)) {
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
	}
}