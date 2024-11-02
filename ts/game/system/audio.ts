
import { game } from 'game'
import { Entity } from 'game/entity'
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

		this.updateSound();
	}

	override preRender() : void {
		super.preRender();

		this.updateSound();
	}

	private updateSound() : void {
		// Set sound positions
		game.entities().getMap(EntityType.PLAYER).executeIf((player : Player) => {
			this.updatePos(player.clientId(), player);
		}, (player : Player) => {
			return player.valid();
		});
		if (game.lakitu().validTargetEntity()) {
			this.updatePos(game.clientId(), game.lakitu().targetEntity());
		}
	}

	private updatePos(id : number, target : Entity) : void {
		// Prefer mesh since sound will be attached to mesh.
		if (target.hasModel() && target.model().hasMesh()) {
			let pos = target.model().mesh().position;
			ui.updatePos(game.clientId(), {
				x: pos.x,
				y: pos.y,
				z: game.lakitu().camera().position.z / 3,
			});
		} else if (target.hasProfile()) {
			let pos = target.profile().getRenderPos();
			ui.updatePos(game.clientId(), {
				x: pos.x,
				y: pos.y,
				z: game.lakitu().camera().position.z / 3,
			});
		}
	}
}