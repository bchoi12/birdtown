 import { game } from 'game'
import { ComponentType } from 'game/component/api'
import { Profile } from 'game/component/profile'
import { NetworkBehavior } from 'game/game_object'
import { Entity } from 'game/entity'
import { ClientSystem, System } from 'game/system'
import { SystemType } from 'game/system/api'

import { GameData, DataFilter } from 'game/game_data'

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
	private _keys : Set<KeyType>;
	private _keyStates : Map<KeyType, KeyState>;
	private _mouse : Vec2;
	private _dir : Vec2;
	private _changeNum : number;
	private _hostChangeNum : number;

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
		this._changeNum = 0;
		this._hostChangeNum = 0;

		for (const stringKey in KeyType) {
			const key = Number(KeyType[stringKey]);
			if (Number.isNaN(key) || key <= 0) {
				continue;
			}

			// TODO: turn into single set of keys
			this.addProp<boolean>({
				has: () => { return this._keyStates.has(key); },
				export: () => { return this._keys.has(key); },
				import: (obj : boolean) => {
					if (<boolean>obj) {
						this._keys.add(key);
					} else {
						this._keys.delete(key);
					}
				},
				options: {
					refreshInterval: 100,
					filters: GameData.udpFilters,
				},
			})
		}

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
			has: () => { return this._changeNum > 0 },
			export: () => { return this._changeNum; },
			import: (obj : number) => { this._changeNum = obj; },
			validate: (obj : number) => { this._hostChangeNum = obj; },
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

	protected updateKey(key : KeyType, state : KeyState) : boolean {
		if (state === KeyState.RELEASED || state === KeyState.UP) {
			return this.releaseKey(<KeyType>key);
		} else {
			return this.pressKey(<KeyType>key);
		}
	}

	protected pressKey(key : KeyType) : boolean {
		if (!this.keyDown(key)) {
			this._keyStates.set(key, KeyState.PRESSED);
			return true;
		} else if (this.keyPressed(key)) {
			this._keyStates.set(key, KeyState.DOWN);
			return true;
		}
		return false;
	}

	protected releaseKey(key : KeyType) : boolean {
		if (!this.keyUp(key)) {
			this._keyStates.set(key, KeyState.RELEASED);
			return true;
		} else if (this.keyReleased(key)) {
			this._keyStates.set(key, KeyState.UP);
			return true;
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
			console.log("Error: %s target entity must have profile", this.name());
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

		if (changed) {
			this._changeNum++;
		}
		if (this.isHost()) {
			this._hostChangeNum = this._changeNum;
		}
	}

	override preRender(millis : number) : void {
		super.preRender(millis);

		if (this.isSource()) {
			this.updateMouse();
		}
	}
}