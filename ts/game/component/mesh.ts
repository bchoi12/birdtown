import * as BABYLON from 'babylonjs'

import { game } from 'game'
import { Component, ComponentBase, ComponentType } from 'game/component'
import { Data, DataFilter, DataMap } from 'game/data'
import { Entity } from 'game/entity'

import { defined } from 'util/common'

type MeshOptions = {
	readyFn : (entity : Entity) => boolean;
	meshFn : () => BABYLON.Mesh;
}

export class Mesh extends ComponentBase implements Component {

	private _readyFn : (entity : Entity) => boolean;
	private _meshFn : () => BABYLON.Mesh;

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

		this._mesh = this._meshFn();
	}

	override delete() : void {
		if (defined(this._mesh)) {
			this._mesh.dispose();
		}
	}

	mesh() : BABYLON.Mesh { return this._mesh; }

	override preRender() : void {
		super.preRender();

		if (!defined(this._mesh)) {
			return;
		}

		let profile = this.entity().profile();
		if (defined(this._mesh) && defined(profile)) {
			this._mesh.position.x = profile.pos().x;
			this._mesh.position.y = profile.pos().y;
			this._mesh.rotation.z = profile.angle();
		}
	}
}