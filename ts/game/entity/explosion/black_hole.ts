
import { Association } from 'game/component/association'
import { EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Explosion } from 'game/entity/explosion'
import { MaterialType } from 'game/factory/api'

export class BlackHole extends Explosion {

	private _association : Association;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.BLACK_HOLE, entityOptions);

		this._association = this.addComponent<Association>(new Association(entityOptions.associationInit));
	}

	override force() : number { return -0.4; }
	override materialType() : MaterialType { return MaterialType.BLACK_HOLE; }
}