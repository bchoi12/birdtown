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

export class Keys extends ClientSideSystem implements System {

	private _keys : Set<KeyType>;
	private _keyStates : Map<KeyType, SeqMap<number, boolean>>;
	private _changeNum : Map<KeyType, number>;
	private _mouse : Vec2;
	private _dir : Vec2;
	private _keyNum : number;
	private _hostKeyNum : number;

	constructor(clientId : number) {
		super(SystemType.KEYS, clientId);

		this.addNameParams({
			base: "keys",
			id: this.clientId(),
		});

		this._keys = new Set();
		this._keyStates = new Map();
		this._changeNum = new Map();
		this._mouse = Vec2.zero();
		this._dir = Vec2.i();
		this._keyNum = 0;
		this._hostKeyNum = 0;

		this.addProp<Array<KeyType>>({
			export: () => { return Array.from(this._keys); },
			import: (obj : Array<KeyType>) => { this._keys = new Set(obj); },
			rollback: (obj : Array<KeyType>, seqNum : number) => {
				this.updateKeys(new Set(obj), seqNum);
			},
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

		// TODO: only send when keys change
		this.addProp<number>({
			has: () => { return this._keyNum > 0; },
			export: () => { return this._keyNum; },
			import: (obj : number) => { this._keyNum = Math.max(obj, this._keyNum); },
			validate: (obj : number) => { this._hostKeyNum = Math.max(obj, this._hostKeyNum); },
			options: {
				filters: GameData.udpFilters,
			},
		});
	}

	keyDown(key : KeyType, seqNum? : number) : boolean {
		if (!this._keyStates.has(key)) { return false; }

		const seqMap = this._keyStates.get(key);
		const [state, ok] = defined(seqNum) ? seqMap.getOrPrev(seqNum) : seqMap.peek();
		return ok && state;
	}
	keyUp(key : KeyType, seqNum? : number) : boolean {
		if (!this._keyStates.has(key)) { return true; }

		const seqMap = this._keyStates.get(key);
		const [state, ok] = defined(seqNum) ? seqMap.getOrPrev(seqNum) : seqMap.peek();
		return !ok || !state;
	}
	keyPressed(key : KeyType, seqNum? : number) : boolean {
		if (!this._keyStates.has(key)) { return false; }

		const seqMap = this._keyStates.get(key);
		if (!defined(seqNum)) {
			let hasMax;
			[seqNum, hasMax] = seqMap.max();

			if (!hasMax) {
				return false;
			}
		}
		return this.keyDown(key, seqNum) && this.keyUp(key, seqNum - 1);
	}
	keyReleased(key : KeyType, seqNum? : number) : boolean {
		if (!this._keyStates.has(key)) { return true; }

		const seqMap = this._keyStates.get(key);
		if (!defined(seqNum)) {
			let hasMax;
			[seqNum, hasMax] = seqMap.max();

			if (!hasMax) {
				return false;
			}
		}
		return this.keyUp(key, seqNum) && this.keyDown(key, seqNum - 1);
	}
	keys(seqNum : number) : Set<KeyType> {
		let keys = new Set<KeyType>();
		this._keyStates.forEach((seqMap : SeqMap<number, boolean>, keyType : KeyType) => {
			if (this.keyDown(keyType, seqNum)) {
				keys.add(keyType);
			}
		});
		return keys;
	}
	dir() : Vec2 { return this._dir; }
	mouse() : Vec2 { return this._mouse; }
	mouseWorld() : BABYLON.Vector3 { return new BABYLON.Vector3(this._mouse.x, this._mouse.y, 0); }

	framesAhead() : number {
		if (this.isHost() || !this.isSource()) { return 0; }

		return Math.max(0, this._keyNum - this._hostKeyNum);
	}
	framesSinceChange() : number {
		let frames = 0;
		if (this.isHost() || !this.isSource()) { return frames; }

		this._changeNum.forEach((num : number) => {
			if (num > this._hostKeyNum) {
				frames = Math.max(frames, this._keyNum - num);
			}
		});
		return frames;
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
		const millis = stepData.millis;
		const seqNum = stepData.seqNum;

		if (seqNum < this._keyNum) { return; }

		if (this.isSource()) {
			this._keyNum++;
			this._keys = ui.keys();
			this.updateMouse();
		}

		this.updateKeys(this._keys, seqNum);
	}

	override preRender() : void {
		super.preRender();

		if (this.isSource()) {
			this.updateMouse();
		}
	}

	private updateKeys(keys : Set<KeyType>, seqNum : number) : void {
		keys.forEach((keyType : KeyType) => {
			this.pressKey(keyType, seqNum);
		});

		this._keyStates.forEach((seqMap : SeqMap<number, boolean>, keyType : KeyType) => {
			if (!keys.has(keyType)) {
				this.releaseKey(keyType, seqNum);
			}
		});
	}

	// Return true if new key is pressed
	private pressKey(key : KeyType, seqNum : number) : void {
		if (!this._keyStates.has(key)) {
			this._keyStates.set(key, new SeqMap<number, boolean>(NetworkGlobals.rollbackBufferSize));
		}

		this._keyStates.get(key).insert(seqNum, true);

		// Mark key state change
		if (this.keyUp(key, seqNum - 1)) {
			this._changeNum.set(key, this._keyNum);
		}
	}

	// Return true if new key is released
	private releaseKey(key : KeyType, seqNum : number) : void {
		if (!this._keyStates.has(key)) {
			this._keyStates.set(key, new SeqMap<number, boolean>(NetworkGlobals.rollbackBufferSize));
		}

		this._keyStates.get(key).insert(seqNum, false);

		// Mark key state change
		if (this.keyDown(key, seqNum - 1)) {
			this._changeNum.set(key, this._keyNum);
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