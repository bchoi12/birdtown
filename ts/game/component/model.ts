import * as BABYLON from '@babylonjs/core/Legacy/legacy'

import { game } from 'game'
import { GameObjectState } from 'game/api'
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

type ModelOptions = {
	shadowType? : ShadowType;
	meshFn : MeshFn;
	readyFn? : ReadyFn;
}

export class Model extends ComponentBase implements Component {

	private _options : ModelOptions;
	private _onLoadFns : Array<OnLoadFn>;
	private _animationHandler : AnimationHandler;
	private _bones : Map<string, BABYLON.Bone>;

	private _translation : BABYLON.Vector3;
	private _scaling : BABYLON.Vector3;

	// TODO: multi mesh support
	private _mesh : BABYLON.Mesh;

	constructor(options : ModelOptions) {
		super(ComponentType.MODEL);

		this._options = options;
		this._onLoadFns = new Array();
		this._animationHandler = new AnimationHandler();
		this._bones = new Map();

		this._translation = new BABYLON.Vector3(0, 0, 0);
		this._scaling = new BABYLON.Vector3(1, 1, 1);

		this._mesh = null;
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

	translation() : BABYLON.Vector3 { return this._translation; }
	setTranslation(translation : BABYLON.Vector3) : void { this._translation.copyFrom(translation); }
	scaling() : BABYLON.Vector3 { return this._scaling; }
	setScaling(scaling : BABYLON.Vector3) : void { this._scaling.copyFrom(scaling); }

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

	registerAnimation(animation : BABYLON.AnimationGroup, group? : number) { this._animationHandler.register(animation, group); }
	playAnimation(name : string, loop? : boolean) : void { this._animationHandler.play(name, loop); }
	stopAllAnimations() : void { this._animationHandler.stopAll(); }

	registerBone(bone : BABYLON.Bone) { this._bones.set(bone.name, bone); }
	hasBone(name : string) : boolean { return this._bones.has(name); }
	getBone(name : string) : BABYLON.Bone { return this._bones.get(name); }

	resetTransforms() : void {
		this._mesh.position.copyFrom(this._translation);
		this._mesh.scaling.copyFrom(this._scaling);
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