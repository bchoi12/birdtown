import * as BABYLON from 'babylonjs'

import { game } from 'game'
import { StepData } from 'game/game_object'
import { Component, ComponentBase } from 'game/component'
import { ComponentType, ShadowType } from 'game/component/api'
import { Profile } from 'game/component/profile'
import { Entity } from 'game/entity'
import { AnimationHandler } from 'game/util/animation_handler'

import { GameData, DataFilter } from 'game/game_data'

import { defined } from 'util/common'
import { Vec, Vec2 } from 'util/vector'

type MeshFn = (model : Model) => void;
type OnLoadFn = (model : Model) => void;
type ReadyFn = (model : Model) => boolean;

type MeshOptions = {
	shadowType? : ShadowType;
	meshFn : MeshFn;
	readyFn? : ReadyFn;
}

export class Model extends ComponentBase implements Component {

	private _options : MeshOptions;
	private _offset : Vec2;
	private _onLoadFns : Array<OnLoadFn>;

	// TODO: multi mesh support
	private _mesh : BABYLON.Mesh;
	private _animationHandler : AnimationHandler
	private _bones : Map<string, BABYLON.Bone>;

	constructor(options : MeshOptions) {
		super(ComponentType.MODEL);

		this.setName({ base: "model" });

		this._options = options;
		this._offset = Vec2.zero();
		this._onLoadFns = new Array();
	}

	override ready() : boolean {
		return super.ready()
			&& (!defined(this._options.readyFn) || this._options.readyFn(this));
	}

	override initialize() : void {
		super.initialize();
		this._options.meshFn(this);

		if (this._options.shadowType !== ShadowType.ALL_OFF) {
			this.onLoad((loaded : Model) => {
				game.world().renderShadows(loaded.mesh());
			});
		}
	}

	override dispose() : void {
		super.dispose();

		this.onLoad((model : Model) => {
			model.mesh().dispose();
		});
	}

	setOffset(offset : Vec) : void {
		this._offset.copyVec(offset);
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
		this._mesh.position.x = profile.pos().x + this._offset.x;
		this._mesh.position.y = profile.pos().y + this._offset.y;

		if (profile.hasAngle()) {
			this._mesh.rotation.z = profile.angle();
		}

		if (profile.hasScaling()) {
			this._mesh.scaling.x = profile.scaling().x;
			this._mesh.scaling.y = profile.scaling().y;
		}
	}

	override preRender() : void {
		super.preRender();

		if (!this.hasMesh()) {
			return;
		}

		if (this.entity().hasProfile()) {
			this.copyProfile(this.entity().getProfile());
		}
	}
}