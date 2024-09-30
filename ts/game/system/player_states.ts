
import { game } from 'game'
import { System, ClientSystemManager } from 'game/system'
import { SystemType } from 'game/system/api'
import { PlayerState } from 'game/system/player_state'
import { PlayerConfig } from 'game/util/player_config'

import { GameMessage, GameMessageType} from 'message/game_message'

import { ui } from 'ui'

export class PlayerStates extends ClientSystemManager implements System {

	constructor() {
		super(SystemType.PLAYER_STATES);

		this.setFactoryFn((clientId : number) => { return this.addPlayerState(new PlayerState(clientId)); })
	}

	override handleMessage(msg : GameMessage) : void {
		super.handleMessage(msg);

		if (msg.type() !== GameMessageType.CLIENT_DISCONNECT) {
			return;
		}

		if (this.hasPlayerState(msg.getClientId())) {
			this.playerState(msg.getClientId()).setDisconnected(true);
		}
	}

	updatePlayers(playerConfig : PlayerConfig) : void {
		this.executeIf((playerState : PlayerState) => {
			playerState.setStartingRole(playerConfig.role(playerState.clientId()));
		}, (playerState : PlayerState) => {
			return playerConfig.hasClient(playerState.clientId());
		})
	}

	numPlayers() : number {
		return this.countIf<PlayerState>((playerState : PlayerState) => {
			return playerState.isPlaying();
		});
	}

	addPlayerState(info : PlayerState) : PlayerState { return this.registerChild<PlayerState>(info.clientId(), info); }
	hasPlayerState(clientId : number) : boolean { return this.hasChild(clientId); }
	playerState(clientId? : number) : PlayerState { return this.getChild<PlayerState>(clientId ? clientId : game.clientId()); }
	unregisterPlayerState(clientId : number) : void { this.unregisterChild(clientId); }
}