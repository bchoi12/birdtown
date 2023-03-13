 import { game } from 'game'
import { ComponentType } from 'game/component'
import { Profile } from 'game/component/profile'
import { NetworkBehavior } from 'game/core'
import { Entity } from 'game/entity'
import { ClientSystem, System, SystemType } from 'game/system'

import { Data, DataFilter } from 'network/data'

import { ui, Key } from 'ui'
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
	private _keys : Set<Key>;
	private _keyStates : Map<Key, KeyState>;
	private _mouse : Vec2;
	private _dir : Vec2;

	constructor(gameId : number) {
		super(SystemType.KEYS, gameId);

		this.setName({
			base: "keys",
			id: this.gameId(),
		});

		this._keys = new Set();
		this._keyStates = new Map();
		this._mouse = Vec2.zero();
		this._dir = Vec2.i();

		for (const stringKey in Key) {
			const key = Number(Key[stringKey]);
			if (Number.isNaN(key) || key <= 0) {
				continue;
			}

			this.registerProp<boolean>(key, {
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
					filters: Data.udpFilters,
				},
			})
		}

		this.addProp<Vec>({
			export: () => { return this._mouse.toVec(); },
			import: (obj : Vec) => { this._mouse.copyVec(obj); },
			options: {
				refreshInterval: 100,
				filters: Data.udpFilters,
			},
		});
		this.addProp<Vec>({
			export: () => { return this._dir.toVec(); },
			import: (obj : Vec) => { this._dir.copyVec(obj); },
			options: {
				refreshInterval: 100,
				filters: Data.udpFilters,
			},
		});
	}

	keyDown(key : Key) : boolean { return this._keyStates.has(key) && (this._keyStates.get(key) === KeyState.DOWN || this.keyPressed(key)); }
	keyUp(key : Key) : boolean { return this._keyStates.has(key) && (this._keyStates.get(key) === KeyState.UP || this.keyReleased(key)); }
	keyPressed(key : Key) : boolean { return this._keyStates.has(key) && this._keyStates.get(key) === KeyState.PRESSED; }
	keyReleased(key : Key) : boolean { return this._keyStates.has(key) && this._keyStates.get(key) === KeyState.RELEASED; }
	dir() : Vec2 { return this._dir; }
	mouse() : Vec2 { return this._mouse; }
	mouseWorld() : BABYLON.Vector3 { return new BABYLON.Vector3(this._mouse.x, this._mouse.y, 0); }

	protected updateKey(key : Key, state : KeyState) : void {
		if (state === KeyState.RELEASED || state === KeyState.UP) {
			this.releaseKey(<Key>key);
		} else {
			this.pressKey(<Key>key);
		}
	}

	protected pressKey(key : Key) : void {
		if (this.keyDown(key)) {
			this._keyStates.set(key, KeyState.DOWN);
		} else {
			this._keyStates.set(key, KeyState.PRESSED);
		}
	}

	protected releaseKey(key : Key) : void {
		if (this.keyUp(key)) {
			this._keyStates.set(key, KeyState.UP);
		} else {
			this._keyStates.set(key, KeyState.RELEASED);
		}
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

		this._keys.forEach((key : Key) => {
			this.pressKey(key);
		});
		this._keyStates.forEach((keyState : KeyState, key : Key) => {
			if (!this._keys.has(key)) {
				this.releaseKey(key);
			}
		});
	}

	override preRender(millis : number) : void {
		super.preRender(millis);

		if (this.isSource()) {
			this.updateMouse();
		}
	}
}