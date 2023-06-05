 import { game } from 'game'
import { ComponentType } from 'game/component/api'
import { Profile } from 'game/component/profile'
import { NetworkBehavior } from 'game/game_object'
import { Entity } from 'game/entity'
import { ClientSystem, System } from 'game/system'
import { SystemType } from 'game/system/api'

import { GameData, DataFilter } from 'game/game_data'

import { settings } from 'settings'

import { ui } from 'ui'
import { KeyType } from 'ui/api'

import { defined } from 'util/common'
import { Vec, Vec2 } from 'util/vector'

enum KeyState {
	UNKNOWN,
	PRESSED,
	DOWN,
	RELEASED,
	UP,
}

export class Keys extends ClientSystem implements System {

	private static readonly _maxPredict : number = 0.3;
	private static readonly _minPredict : number = 0.1;
	// Millis to go from 0 to 1
	private static readonly _predictResetTime : number = 1000;

	private _keys : Set<KeyType>;
	private _keyStates : Map<KeyType, KeyState>;
	private _mouse : Vec2;
	private _dir : Vec2;

	private _predictWeight : number;
	private _changeNum : number;
	private _seqNum : number;
	private _hostChangeNum : number;
	private _hostSeqNum : number;

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

		this._predictWeight = Keys._minPredict;
		this._changeNum = 0;
		this._seqNum = 0;
		this._hostChangeNum = 0;
		this._hostSeqNum = 0;

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

		this.addProp<number>({
			has: () => { return this._changeNum > 0; },
			export: () => { return this._changeNum; },
			import: (obj : number) => { this._changeNum = Math.max(this._changeNum, obj); },
			validate: (obj : number) => { this._hostChangeNum = Math.max(this._hostChangeNum, obj); },
			options: {
				filters: GameData.udpFilters,
			},
		});
		this.addProp<number>({
			export: () => { return this._seqNum; },
			import: (obj : number) => { this._seqNum = Math.max(this._seqNum, obj); },
			validate: (obj : number) => { this._hostSeqNum = Math.max(this._hostSeqNum, obj); },
			options: {
				filters: GameData.udpFilters,
			},
		});
	}

	keyDown(key : KeyType) : boolean { return this._keyStates.has(key) && (this._keyStates.get(key) === KeyState.DOWN || this.keyPressed(key)); }
	keyUp(key : KeyType) : boolean { return this._keyStates.has(key) && (this._keyStates.get(key) === KeyState.UP || this.keyReleased(key)); }
	keyPressed(key : KeyType) : boolean { return this._keyStates.has(key) && this._keyStates.get(key) === KeyState.PRESSED; }
	keyReleased(key : KeyType) : boolean { return this._keyStates.has(key) && this._keyStates.get(key) === KeyState.RELEASED; }
	keys() : Set<KeyType> { return this._keys; }
	dir() : Vec2 { return this._dir; }
	mouse() : Vec2 { return this._mouse; }
	mouseWorld() : BABYLON.Vector3 { return new BABYLON.Vector3(this._mouse.x, this._mouse.y, 0); }

	predictWeight() : number {
		if (!this.isSource() || !settings.enablePrediction) {
			return 0;
		}
		return this._predictWeight;
	}

	protected updateKey(key : KeyType, state : KeyState) : boolean {
		if (state === KeyState.RELEASED || state === KeyState.UP) {
			return this.releaseKey(<KeyType>key);
		} else {
			return this.pressKey(<KeyType>key);
		}
	}

	// Return true if new key is pressed
	protected pressKey(key : KeyType) : boolean {
		if (!this.keyDown(key)) {
			this._keyStates.set(key, KeyState.PRESSED);
			return true;
		} else if (this.keyPressed(key)) {
			this._keyStates.set(key, KeyState.DOWN);
		}
		return false;
	}

	// Return true if new key is released
	protected releaseKey(key : KeyType) : boolean {
		if (!this.keyUp(key)) {
			this._keyStates.set(key, KeyState.RELEASED);
			return true;
		} else if (this.keyReleased(key)) {
			this._keyStates.set(key, KeyState.UP);
		}
		return false;
	}

	protected updateMouse() : void {
		const mouseWorld = game.mouse();
		this._mouse.copyVec({ x: mouseWorld.x, y: mouseWorld.y });

		if (this.hasTargetEntity()) {
			const profile = <Profile>this.targetEntity().getComponent(ComponentType.PROFILE);
			this._dir = this._mouse.clone().sub(profile.pos()).normalize();
		}
	}

	override setTargetEntity(entity : Entity) {
		if (!entity.hasComponent(ComponentType.PROFILE)) {
			console.error("Error: %s target entity must have profile", this.name());
			return;
		}

		super.setTargetEntity(entity);
	}

	override preUpdate(millis : number) : void {
		super.preUpdate(millis);

		if (this.isSource()) {
			this._keys = ui.keys();
			this.updateMouse();
		}

		let changed = false;

		this._keys.forEach((key : KeyType) => {
			changed = changed || this.pressKey(key);
		});
		this._keyStates.forEach((keyState : KeyState, key : KeyType) => {
			if (!this._keys.has(key)) {
				changed = changed || this.releaseKey(key);
			}
		});

		if (this.isSource()) {
			this._seqNum++;

			if (changed) {
				this._changeNum++;
			}

			if (!this.isHost()) {
				const delay = this._seqNum - this._hostSeqNum;
				const changeDelay = this._changeNum - this._hostChangeNum;

				let target = changeDelay >= 1 ? Keys._minPredict : Keys._maxPredict;

				if (this._predictWeight > target) {
					this._predictWeight -= millis / Keys._predictResetTime;
					this._predictWeight = Math.max(this._predictWeight, target);
				} else {
					this._predictWeight += millis / Keys._predictResetTime;
					this._predictWeight = Math.min(this._predictWeight, target);
				}
			}
		}
	}

	override preRender(millis : number) : void {
		super.preRender(millis);

		if (this.isSource()) {
			this.updateMouse();
		}
	}
}