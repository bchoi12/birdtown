
import { game } from 'game'
import { Component, ComponentBase, ComponentType } from 'game/component'

import { Entity } from 'game/entity'

import { RingBuffer } from 'util/ring_buffer'
import { defined } from 'util/common'

enum Prop {
	UNKNOWN,
	HEALTH,
}

type Tick = {
	fromId : number;
	amount : number;
	ts : number;
};

export class Health extends ComponentBase implements Component {

	private _initialHealth : number;
	private _health : number;
	private _damageBuffer : RingBuffer<Tick>;

	constructor(health : number) {
		super(ComponentType.HEALTH);

		this.setName({ base: "health" });

		this._initialHealth = health;
		this._health = health;
		this._damageBuffer = new RingBuffer(20);

		this.registerProp(Prop.HEALTH, {
			export: () => { return this._health; },
			import: (obj : Object) => { this._health = <number>obj; }
		});
	}

	override ready() : boolean { return true; }

	reset() : void {
		this._health = this._initialHealth;
		this._damageBuffer.clear();
	}

	dead() : boolean { return this._health <= 0; }

	heal(amount : number, from? : Entity) : void { this.damage(-amount, from); }

	damage(amount : number, from? : Entity) : void {
		if (!this.isSource()) {
			return;
		}

		if (this.dead() && amount >= 0) {
			return;
		}

		amount = Math.min(amount, this._health);
		this._health -= amount;

		if (from && amount > 0) {
			this._damageBuffer.push({
				fromId: from.id(),
				amount: amount,
				ts: Date.now(),
			});
		}
	}

	lastDamageId(millis : number) : [number, boolean] {
		while(!this._damageBuffer.empty()) {
			const tick = this._damageBuffer.pop();
			if (Date.now() - tick.ts > millis) {
				break;
			}

			if (tick.amount <= 0) {
				continue;
			}

			return [tick.fromId, true];
		}

		return [0, false];
	}
}