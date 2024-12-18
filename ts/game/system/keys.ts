import * as BABYLON from '@babylonjs/core/Legacy/legacy'

import { game } from 'game'
import { GameObjectState } from 'game/api'
import { GameData, DataFilter } from 'game/game_data'
import { StepData } from 'game/game_object'
import { Entity } from 'game/entity'
import { ClientSideSystem, System } from 'game/system'
import { SystemType } from 'game/system/api'
import { Key } from 'game/system/key'

import { NetworkGlobals } from 'global/network_globals'

import { ui } from 'ui'
import { KeyType } from 'ui/api'

import { Vec, Vec2 } from 'util/vector'

export class Keys extends ClientSideSystem implements System {

	private static readonly _trackedTypes = new Array(
		KeyType.LEFT,
		KeyType.RIGHT,
		KeyType.JUMP,
		KeyType.INTERACT,
		KeyType.SQUAWK,
		KeyType.MOUSE_CLICK,
		KeyType.ALT_MOUSE_CLICK);

	private _mouse : Vec2;
	private _dir : Vec2;

	constructor(clientId : number) {
		super(SystemType.KEYS, clientId);

		this._mouse = Vec2.zero();
		this._dir = Vec2.i();

		this.addProp<Vec>({
			export: () => { return this._mouse.toVec(); },
			import: (obj : Vec) => { this._mouse.copyVec(obj); },
			options: {
				refreshInterval: 100,
				filters: GameData.udpFilters,
			},
		});
		this.addProp<Vec>({
			export: () => { return this._dir.toVec(); },
			import: (obj : Vec) => { this._dir.copyVec(obj); },
			options: {
				refreshInterval: 100,
				filters: GameData.udpFilters,
			},
		});

		Keys._trackedTypes.forEach((keyType : KeyType) => {
			this.addSubSystem(keyType, new Key(keyType, clientId));
		});
	}

	getKey(type : KeyType) : Key { return this.getChild<Key>(type); }
	keys() : Set<KeyType> {
		let keys = new Set<KeyType>();
		if (this.state() === GameObjectState.DEACTIVATED) {
			return keys;
		}

		this.findAll<Key>((key : Key) => {
			return key.down();
		}).forEach((key : Key) => {
			keys.add(key.keyType());
		});
		return keys;
	}
	dir() : Vec2 { return this._dir; }
	mouse() : Vec2 { return this._mouse; }
	mouseWorld() : BABYLON.Vector3 { return new BABYLON.Vector3(this._mouse.x, this._mouse.y, 0); }

	maxDiff() : number {
		let diff = 0;
		if (this.isHost() || !this.isSource()) { return diff; }

		this.execute<Key>((key : Key) => {
			diff = Math.max(diff, key.diff());
		});
		return diff;
	}

	override setTargetEntity(entity : Entity) {
		if (!entity.hasProfile()) {
			console.error("Error: %s target entity must have profile", this.name());
			return;
		}

		super.setTargetEntity(entity);
	}

	override preUpdate(stepData : StepData) : void {
		super.preUpdate(stepData);

		if (this.isSource()) {
			this.updateMouse();
		}
	}

	override preRender() : void {
		super.preRender();
		if (this.isSource()) {
			this.updateMouse();
		}
	}

	private updateMouse() : void {
		const mouseWorld = this.computeMouseWorld();
		this._mouse.copyVec({ x: mouseWorld.x, y: mouseWorld.y });

		if (this.validTargetEntity()) {
			const profile = this.targetEntity().profile();
			this._dir = this._mouse.clone().sub(profile.pos()).normalize();
		}
	}

	private computeMouseWorld() : BABYLON.Vector3 {
		const mouse = ui.mouse();
		const screen = ui.screenRect();

		// Z-coordinate is not necessarily 0
		let mouseWorld = BABYLON.Vector3.Unproject(
			new BABYLON.Vector3(mouse.x, mouse.y, 0.99),
			screen.width,
			screen.height,
			BABYLON.Matrix.Identity(),
			game.lakitu().camera().getViewMatrix(),
			game.lakitu().camera().getProjectionMatrix());

		if (Math.abs(mouseWorld.z) < 1e-3) {
			return mouseWorld;
		}

		// Camera to mouse
		mouseWorld.subtractInPlace(game.lakitu().camera().position);

		// Scale camera to mouse to end at z = 0
		const scale = Math.abs(game.lakitu().camera().position.z / mouseWorld.z);

		// Camera to mouse at z = 0
		mouseWorld.scaleInPlace(scale);

		// World coordinates
		mouseWorld.addInPlace(game.lakitu().camera().position);

		return mouseWorld;
	}
}