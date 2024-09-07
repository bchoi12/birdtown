
import { HexColors } from 'game/component/hex_colors'
import { Profile } from 'game/component/profile'
import { EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Bound } from 'game/entity/bound'
import { ColorCategory, DepthType } from 'game/factory/api'

export class Wall extends Bound {

	private _hexColors : HexColors;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.WALL, entityOptions);

		this._hexColors = this.addComponent<HexColors>(new HexColors(entityOptions.hexColorsInit));
	}

	override initialize() : void {
		super.initialize();

		if (this._hexColors.hasMainColor()) {
			this.setMinimapOptions({
				color: this._hexColors.mainColor().toString(),
				depthType: DepthType.WALL,
			});
		}
	}
}