import * as BABYLON from "babylonjs";

import { game } from 'game'
import { GameData, DataFilter } from 'game/game_data'
import { StepData } from 'game/game_object'
import { Entity } from 'game/entity'
import { ClientSideSystem, System } from 'game/system'
import { SystemType } from 'game/system/api'

import { NetworkGlobals } from 'global/network_globals'

import { settings } from 'settings'

import { ui } from 'ui'
import { KeyType } from 'ui/api'

import { defined } from 'util/common'
import { SeqMap } from 'util/seq_map'
import { Vec, Vec2 } from 'util/vector'

enum KeyState {
	UNKNOWN,
	PRESSED,
	DOWN,
	RELEASED,
	UP,
}

export class Keys extends ClientSideSystem implements System {

	private _keys : Set<KeyType>;
	private _keyStates : Map<KeyType, SeqMap<number, KeyState>>;
	private _mouse : Vec2;
	private _dir : Vec2;

	constructor(clientId : number) {
		super(SystemType.KEYS, clientId);

		this.setName({
			base: "keys",
			id: this.clientId(),
		});

		this._keys = new Set();
		this._keyStates = new Map();
		this._mouse = Vec2.zero();
		this._dir = Vec2.i();

		// TODO: figure out how this works with rollback
		this.addProp<Array<KeyType>>({
			export: () => { return Array.from(this._keys); },
			import: (obj : Array<KeyType>) => { this._keys = new Set(obj); },
			options: {
				refreshInterval: 100,
				filters: GameData.udpFilters,
				equals: (a : Array<KeyType>, b : Array<KeyType>) => {
					if (a.length !== b.length) { return false; }

					const keySet = new Set(a);
					for (let key of b) {
						if (!keySet.has(key)) {
							return false;
						}
					}
					return true;
				},
			},
		})

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
	}

	keyDown(key : KeyType, seqNum : number) : boolean {
		if (!this._keyStates.has(key)) { return false; }

		const [state, ok] = this._keyStates.get(key).get(seqNum);
		return ok && (state === KeyState.DOWN || state === KeyState.PRESSED);
	}
	keyUp(key : KeyType, seqNum : number) : boolean {
		if (!this._keyStates.has(key)) { return true; }

		const [state, ok] = this._keyStates.get(key).get(seqNum);
		return ok && (state === KeyState.UP || state === KeyState.RELEASED);
	}
	keyPressed(key : KeyType, seqNum : number) : boolean {
		if (!this._keyStates.has(key)) { return false; }

		const [state, ok] = this._keyStates.get(key).get(seqNum);
		return ok && state === KeyState.PRESSED;
	}
	keyReleased(key : KeyType, seqNum : number) : boolean {
		if (!this._keyStates.has(key)) { return true; }

		const [state, ok] = this._keyStates.get(key).get(seqNum);
		return ok && state === KeyState.RELEASED;
	}
	keys(seqNum : number) : Set<KeyType> {
		let keys = new Set<KeyType>();
		this._keyStates.forEach((seqMap : SeqMap<number, KeyState>, keyType : KeyType) => {
			let [state, ok] = seqMap.get(seqNum);
			if (ok && (state === KeyState.DOWN || state === KeyState.PRESSED)) {
				keys.add(keyType);
			}
		});
		return keys;
	}
	dir() : Vec2 { return this._dir; }
	mouse() : Vec2 { return this._mouse; }
	mouseWorld() : BABYLON.Vector3 { return new BABYLON.Vector3(this._mouse.x, this._mouse.y, 0); }

	override setTargetEntity(entity : Entity) {
		if (!entity.hasProfile()) {
			console.error("Error: %s target entity must have profile", this.name());
			return;
		}

		super.setTargetEntity(entity);
	}

	override preUpdate(stepData : StepData) : void {
		super.preUpdate(stepData);
		const millis = stepData.millis;
		const seqNum = stepData.seqNum;

		if (this.isSource()) {
			this._keys = ui.keys();
			this.updateMouse();
		}

		this._keys.forEach((keyType : KeyType) => {
			this.pressKey(keyType, seqNum);
		});

		this._keyStates.forEach((seqMap : SeqMap<number, KeyState>, keyType : KeyType) => {
			if (!this._keys.has(keyType)) {
				this.releaseKey(keyType, seqNum);
			}
		});
	}

	override preRender() : void {
		super.preRender();

		if (this.isSource()) {
			this.updateMouse();
		}
	}

	// Return true if new key is pressed
	private pressKey(key : KeyType, seqNum : number) : void {
		if (!this._keyStates.has(key)) {
			this._keyStates.set(key, new SeqMap<number, KeyState>(NetworkGlobals.rollbackBufferSize));
		}

		let seqMap = this._keyStates.get(key);
		if (!this.keyDown(key, seqNum - 1)) {
			seqMap.insert(seqNum, KeyState.PRESSED);
		} else {
			seqMap.insert(seqNum, KeyState.DOWN);
		}
	}

	// Return true if new key is released
	private releaseKey(key : KeyType, seqNum : number) : void {
		if (!this._keyStates.has(key)) {
			this._keyStates.set(key, new SeqMap<number, KeyState>(NetworkGlobals.rollbackBufferSize));
		}

		let seqMap = this._keyStates.get(key);
		if (this.keyDown(key, seqNum - 1)) {
			seqMap.insert(seqNum, KeyState.RELEASED);
		} else {
			seqMap.insert(seqNum, KeyState.UP);
		}
	}

	private updateMouse() : void {
		const mouseWorld = this.computeMouseWorld();
		this._mouse.copyVec({ x: mouseWorld.x, y: mouseWorld.y });

		if (this.hasTargetEntity()) {
			const profile = this.targetEntity().getProfile();
			this._dir = this._mouse.clone().sub(profile.pos()).normalize();
		}
	}

	private computeMouseWorld() : BABYLON.Vector3 {
		const mouse = ui.mouse();

		// Z-coordinate is not necessarily 0
		let mouseWorld = BABYLON.Vector3.Unproject(
			new BABYLON.Vector3(mouse.x, mouse.y, 0.99),
			window.innerWidth,
			window.innerHeight,
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