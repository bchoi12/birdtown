
import { game } from 'game'
import { GameObjectState } from 'game/api'
import { AttributeType } from 'game/component/api'
import { Buff, BuffOptions } from 'game/component/buff'
import { EntityType } from 'game/entity/api'
import { Entity } from 'game/entity'
import { Shades } from 'game/entity/equip/shades'
import { BuffType, StatType } from 'game/factory/api'

export class CoolBuff extends Buff {

	private _shades : Entity;

	constructor(type : BuffType, options : BuffOptions) {
		super(type, options);

		this._shades = null;
	}

	override delete() : void {
		super.delete();

		this.deleteShades();
	}

	override boosts(level : number) : Map<StatType, number> {
		return new Map([
			[StatType.BURST_BONUS, level >= 3 ? 1 : 0],
			[StatType.RELOAD_BOOST, level >= 2 ? 0.2 : 0],
			[StatType.SPEED_BOOST, 0.1 * level],
			[StatType.CRIT_CHANCE, 0.2],
		]);
	}

	protected override onLevel(level : number, delta : number) : void {
		super.onLevel(level, delta);

		if (!this.atMaxLevel()) {
			this.deleteShades();
		} else {
			this.addShades();
		}
	}

	private addShades() : void {
		if (this._shades !== null) {
			return;
		}

		let ok = false;
		[this._shades, ok] = game.entities().addEntity<Shades>(EntityType.SHADES, {
			associationInit: {
				owner: this.entity(),
			},
			offline: true,
		});
		this.entity().setAttribute(AttributeType.COOL, true);
	}

	private deleteShades() : void {
		if (this._shades === null) {
			return;
		}

		this._shades.delete();
		this._shades = null;
		this.entity().setAttribute(AttributeType.COOL, false);
	}
}