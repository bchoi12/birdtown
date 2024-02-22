
import { game } from 'game'
import { EntityType } from 'game/entity/api'
import { Player } from 'game/entity/player'
import { StepData } from 'game/game_object'
import { System, SystemBase } from 'game/system'
import { SystemType } from 'game/system/api'

import { ui } from 'ui'

export class Audio extends SystemBase implements System {

	constructor() {
		super(SystemType.AUDIO);
	}

	override postPhysics(stepData : StepData) : void {
		super.postPhysics(stepData);

		// Set sound positions
		game.entities().getMap(EntityType.PLAYER).executeIf((player : Player) => {
			ui.updatePos(player.clientId(), player.profile().getRenderPos());
		}, (player : Player) => {
			return player.initialized() && !player.deleted();
		});
		if (game.lakitu().hasTargetEntity()
			&& game.lakitu().targetEntity().hasProfile()
			&& game.lakitu().targetEntity().initialized()
			&& !game.lakitu().targetEntity().deleted()) {
			ui.updatePos(game.clientId(), game.lakitu().targetEntity().profile().getRenderPos())
		}
	}
}