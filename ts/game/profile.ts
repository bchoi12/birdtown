import * as BABYLON from 'babylonjs'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { Component, ComponentBase, ComponentType } from 'game/component'

interface BodyOptions {
	bodyFn? : () => MATTER.Body;
	meshFn? : () => BABYLON.Mesh;
}

export class Profile extends ComponentBase implements Component {

	private _body : MATTER.Body;
	private _mesh : BABYLON.Mesh;

	constructor(options : BodyOptions) {
		super(ComponentType.PROFILE);

		if (options.bodyFn) {
			this._body = options.bodyFn();
			MATTER.Composite.add(game.physics().world, this._body)
		}

		if (options.meshFn) {
			this._mesh = options.meshFn();
		}
	}

	body() : MATTER.Body { return this._body; }
	pos() : MATTER.Vector { return this._body.position; }

	postPhysics(ts : number) : void {
		this._mesh.position.x = this._body.position.x;
		this._mesh.position.y = this._body.position.y;
	}
}