import * as BABYLON from 'babylonjs'

import { game } from 'game'
import { Component, ComponentBase, ComponentType } from 'game/component'
import { Data, DataFilter, DataMap } from 'game/data'
import { Entity } from 'game/entity'

import { defined } from 'util/common'

type MeshFn = (entity : Entity, onLoad : (mesh: BABYLON.Mesh) => void) => void;

type MeshOptions = {
	readyFn : (entity : Entity) => boolean;
	meshFn : MeshFn;
}

export class Mesh extends ComponentBase implements Component {

	private _readyFn : (entity : Entity) => boolean;
	private _meshFn : MeshFn;

	private _mesh : BABYLON.Mesh;

	constructor(options : MeshOptions) {
		super(ComponentType.MESH);

		this._readyFn = options.readyFn;
		this._meshFn = options.meshFn;
	}

	override ready() : boolean {
		return this._readyFn(this.entity());
	}

	override initialize() : void {
		super.initialize();
		this._meshFn(this.entity(), (mesh : BABYLON.Mesh) => {
			this._mesh = mesh;
		});
	}

	override delete() : void {
		if (this.hasMesh()) {
			this._mesh.dispose();
		}
	}

	hasMesh() : boolean { return defined(this._mesh); }
	mesh() : BABYLON.Mesh { return this._mesh; }

	override preRender() : void {
		super.preRender();

		if (!this.hasMesh()) {
			return;
		}

		let profile = this.entity().profile();
		if (defined(this._mesh) && defined(profile)) {
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