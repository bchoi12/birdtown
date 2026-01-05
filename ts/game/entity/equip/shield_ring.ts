
import * as BABYLON from '@babylonjs/core/Legacy/legacy'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { GameState } from 'game/api'
import { AttributeType } from 'game/component/api'
import { Model } from 'game/component/model'
import { Entity, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Equip, AttachType } from 'game/entity/equip'
import { Player } from 'game/entity/bird/player'
import { StepData } from 'game/game_object'
import { MaterialType } from 'game/factory/api'
import { EntityFactory } from 'game/factory/entity_factory'
import { MaterialFactory } from 'game/factory/material_factory'

import { Fns } from 'util/fns'
import { Optional } from 'util/optional'
import { Vec3 } from 'util/vector'

class ShieldBit {

	private _root : BABYLON.TransformNode;
	private _mesh : BABYLON.Mesh;

	private _spin : Vec3;

	constructor(name : string) {
		this._root = new BABYLON.TransformNode(name);
		this._mesh = BABYLON.MeshBuilder.CreateBox(name, {
			width: 1,
			height: 1,
			depth: 1,
		}, game.scene());
		this._root.addChild(this._mesh);

		// TODO: make actual shield material
		this._mesh.material = MaterialFactory.material(MaterialType.CLIFF_GRAY);

		this._spin = new Vec3({
			x: Fns.randomNoise(2 * Math.PI),
			y: Fns.randomNoise(2 * Math.PI),
			z: Fns.randomNoise(2 * Math.PI),
		});
	}

	root() : BABYLON.TransformNode { return this._root; }
	mesh() : BABYLON.Mesh { return this._mesh; }

	dispose() : void {
		this._mesh.dispose();
		this._root.dispose();
	}

	update(millis : number) : void {
		this._mesh.rotation.x += this._spin.x * millis / 1000;
		this._mesh.rotation.y += this._spin.y * millis / 1000;
		this._mesh.rotation.z += this._spin.z * millis / 1000;
	}
}

export class ShieldRing extends Equip<Player> {

	private static readonly _bitSize = 0.2;

	private _diameter : number;
	private _shield : Optional<number>;
	private _bits : Array<ShieldBit>;
	private _visible : boolean;

	private _model : Model;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.SHIELD_RING, entityOptions);

		this._diameter = 0;
		this._shield = new Optional();
		this._bits = new Array();
		this._visible = true;

		this._model = this.addComponent<Model>(new Model({
			meshFn: (model : Model) => {
				const ownerDim = EntityFactory.getDimension(this.owner().type());
				this._diameter = 2 * Math.max(ownerDim.x, ownerDim.y);
			},
			init: entityOptions.modelInit,
		}));
	}

	override attachType() : AttachType { return AttachType.ROOT; }

	override initialize() : void {
		super.initialize();

		if (this._shield.has()) {
			this.applyShield();
		}
	}

	override delete() : void {
		super.delete();

		this._bits.forEach((bit : ShieldBit) => {
			bit.dispose();
		});
	}

	private createRing(numBits : number) : BABYLON.Mesh {
		let ring = BABYLON.MeshBuilder.CreateTorus(this.name(), {
			thickness: 0.03,
			diameter: this._diameter,
			tessellation: numBits < 3 ? 4 : numBits,
		}, game.scene());
		ring.rotation.y = Math.PI / 2;
		ring.rotation.z = -Math.PI / 2;

		return ring;
	}

	setShield(value : number) : void {
		this._shield.set(value);
		this.applyShield();
	}

	private applyShield() : void {
		if (!this.initialized() || !this._shield.has()) {
			return;
		}

		const shield = this._shield.get();
		if (shield <= 0) {
			this.delete();
			return;
		}

		const numBits = Math.max(1, Math.ceil(shield / 10));
		let rearrange = numBits !== this._bits.length;

		while(numBits < this._bits.length) {
			this._bits.pop().dispose();
		}

		for (let i = 0; i < numBits; ++i) {
			let size = ShieldRing._bitSize;
			if (i === numBits - 1 && shield % 10 > 0) {
				let shieldMod = Math.floor(shield % 10);
				size *= Fns.lerpRange(0.3, (shieldMod === 0 ? 10 : shieldMod) / 10, 1);
			}

			if (this._bits.length <= i) {
				let bit = new ShieldBit(`${this.name()}-${i}`);
				bit.mesh().position.x = this._diameter / 2;
				this._model.root().addChild(bit.root());
				this._bits.push(bit);
			}

			this._bits[i].mesh().scaling.set(size, size, size);

			if (rearrange) {
				this._bits[i].root().rotation.z = (i / numBits) * 2 * Math.PI;
			}
		}

		if (rearrange) {
			let ring = this.createRing(numBits);
			this._model.setMesh(ring);
		}
	}

	override update(stepData : StepData) : void {
		super.update(stepData);
		const millis = stepData.millis;

		if (this.owner().deleted()) {
			this.delete();
			return;
		}

		const visible = !this.owner().deactivated();
		if (this._visible !== visible) {
			this._visible = visible;
			this._model.setVisible(this._visible);
		}

		if (!this._visible) {
			return;
		}

		let sign = this.owner().team() % 2 === 0 ? 1 : -1;
		this._model.rotation().z += sign * 2 * millis / 1000;

		this._bits.forEach((bit : ShieldBit) => {
			bit.update(millis);
		})
	}
}