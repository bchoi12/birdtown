import { game } from 'game'
import { ComponentType } from 'game/component'
import { Profile } from 'game/component/profile'
import { Entity } from 'game/entity'
import { System, SystemBase, SystemType } from 'game/system'
import { Data, DataFilter, DataMap } from 'network/data'

import { ui, Key } from 'ui'
import { Vec, Vec2 } from 'util/vector'

enum KeyState {
	UNKNOWN,
	PRESSED,
	DOWN,
	RELEASED,
	UP,
}

export class Keys extends SystemBase implements System {
	private _clientId : number;
	private _keys : Map<Key, KeyState>;
	private _mouse : Vec2;
	private _dir : Vec2;

	// TODO: set entity to follow and compute direction
	constructor(clientId : number) {
		super(SystemType.KEYS);

		this.setName({
			base: "keys",
			id: clientId,
		});

		this._clientId = clientId;
		this._keys = new Map();
		this._mouse = Vec2.zero();
		this._dir = Vec2.i();

		for (const stringKey in Key) {
			const key = Number(Key[stringKey]);
			if (Number.isNaN(key) || key <= 0) {
				continue;
			}

			this.registerProp(key, {
				has: () => { return this._keys.has(key); },
				export: () => { return this._keys.get(key); },
				import: (obj : Object) => { this.updateKey(key, <KeyState>obj); },
			})
		}

		this.registerProp(this.numProps() + 1, {
			export : () => { return this._mouse.toVec(); },
			import: (obj : Object) => { this._mouse.copyVec(<Vec>obj); }
		});
		this.registerProp(this.numProps() + 1, {
			export : () => { return this._dir.toVec(); },
			import: (obj : Object) => { this._dir.copyVec(<Vec>obj); }
		});
	}

	keyDown(key : Key) : boolean { return this._keys.has(key) && (this._keys.get(key) === KeyState.DOWN || this.keyPressed(key)); }
	keyUp(key : Key) : boolean { return !this._keys.has(key) || (this._keys.get(key) === KeyState.UP || this.keyReleased(key)); }
	keyPressed(key : Key) : boolean { return this._keys.has(key) && this._keys.get(key) === KeyState.PRESSED; }
	keyReleased(key : Key) : boolean { return this._keys.has(key) && this._keys.get(key) === KeyState.RELEASED; }
	dir() : Vec2 { return this._dir; }
	mouse() : Vec2 { return this._mouse; }
	mouseWorld() : BABYLON.Vector3 { return new BABYLON.Vector3(this._mouse.x, this._mouse.y, 0); }

	override setEntity(entity : Entity) {
		if (!entity.has(ComponentType.PROFILE)) {
			console.log("Error: %s target entity must have profile", this.name());
			return;
		}

		this.setName({
			base: this.name(),
			target: entity,
		});

		super.setEntity(entity);
	}

	override preUpdate(millis : number) : void {
		super.preUpdate(millis);

		if (!this.isSource()) {
			return;
		}

		const keys = ui.keys();
		keys.forEach((key : Key) => {
			this.pressKey(key);
		});

		this._keys.forEach((keyState : KeyState, key : Key) => {
			if (!keys.has(key)) {
				this.releaseKey(key);
			}
		});

		const mouseWorld = game.mouse();
		this._mouse.copyVec({ x: mouseWorld.x, y: mouseWorld.y });

		if (this.hasEntity()) {
			const profile = <Profile>this.entity().getComponent(ComponentType.PROFILE);
			this._dir = this._mouse.clone().sub(profile.pos()).normalize();
		}
	}

	override preRender() : void {
		super.preRender();

		if (this.hasEntity()) {
			const profile = <Profile>this.entity().getComponent(ComponentType.PROFILE);
			this._dir = this._mouse.clone().sub(profile.pos()).normalize();
		}
	}

	override isSource() : boolean { return game.id() === this._clientId; }
	override shouldBroadcast() : boolean { return game.options().host || this.isSource(); }

	protected updateKey(key : Key, state : KeyState) : void {
		if (state === KeyState.RELEASED || state === KeyState.UP) {
			this.releaseKey(<Key>key);
		} else {
			this.pressKey(<Key>key);
		}
	}

	protected pressKey(key : Key) : void {
		if (!this.keyDown(key)) {
			this._keys.set(key, KeyState.PRESSED);
		} else {
			this._keys.set(key, KeyState.DOWN);
		}
	}

	protected releaseKey(key : Key) : void {
		if (this.keyDown(key)) {
			this._keys.set(key, KeyState.RELEASED);
		} else {
			this._keys.set(key, KeyState.UP);
		}
	}
}