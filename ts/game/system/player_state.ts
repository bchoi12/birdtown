
import { game } from 'game'
import { EntityType } from 'game/entity/api'
import { Player } from 'game/entity/player'
import { System, ClientSystem } from 'game/system'
import { SystemType } from 'game/system/api'

import { GameMessage, GameMessageType, GameProp } from 'message/game_message'
import { UiMessage, UiMessageType, UiProp } from 'message/ui_message'

import { ui } from 'ui'

export class PlayerState extends ClientSystem implements System {

	private _displayName : string;

	constructor(clientId : number) {
		super(SystemType.PLAYER_STATE, clientId);

		this.addNameParams({
			base: "player_state",
			id: clientId,
		})

		this._displayName = "unknown";
		this.addProp<string>({
			export: () => { return this.displayName(); },
			import: (obj: string) => { this.setDisplayName(obj); },
		});
	}

	setDisplayName(displayName : string) : void {
		this._displayName = displayName;

		this.addNameParams({
			type: this._displayName,
		});

		const uiMsg = new UiMessage(UiMessageType.CLIENT_JOIN);
		uiMsg.setProp(UiProp.CLIENT_ID, this.clientId());
		uiMsg.setProp(UiProp.DISPLAY_NAME, this.displayName());
		ui.handleMessage(uiMsg);
	}
	displayName() : string { return this._displayName; }

	override handleMessage(msg : GameMessage) : void {
		super.handleMessage(msg);

		if (msg.type() === GameMessageType.CLIENT_JOIN) {
			const clientId = msg.getProp<number>(GameProp.CLIENT_ID);
			if (clientId === this.clientId()) {
				const displayName = msg.getProp<string>(GameProp.DISPLAY_NAME);
				this.setDisplayName(displayName);
			}
		}
	}

	override delete() : void {
		super.delete();

		game.entities().getMap(EntityType.PLAYER).executeIf<Player>((player : Player) => {
			player.delete();
		}, (player : Player) => {
			return player.clientId() === this.clientId();
		});

		const uiMsg = new UiMessage(UiMessageType.CLIENT_DISCONNECT);
		uiMsg.setProp(UiProp.CLIENT_ID, this.clientId());
		ui.handleMessage(uiMsg);
	}
}