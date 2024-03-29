
import { HexColors } from 'game/component/hex_colors'
import { Profile } from 'game/component/profile'
import { EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Bound } from 'game/entity/bound'
import { ColorType } from 'game/factory/api'
import { DepthType } from 'game/system/api'

export class Wall extends Bound {

	private _hexColors : HexColors;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.WALL, entityOptions);

		this._hexColors = this.addComponent<HexColors>(new HexColors(entityOptions.hexColorsInit));
	}

	override initialize() : void {
		super.initialize();

		if (this._hexColors.hasMainColor()) {
			this.setMinimapRender(this._hexColors.mainColor().toString(), DepthType.WALL);
		}
	}
}