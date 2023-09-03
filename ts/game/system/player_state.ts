
import { game } from 'game'
import { EntityType } from 'game/entity/api'
import { Player } from 'game/entity/player'
import { System, ClientSystem } from 'game/system'
import { SystemType } from 'game/system/api'

import { GameMessage, GameMessageType, GameProp } from 'message/game_message'
import { UiMessage, UiMessageType, UiProp } from 'message/ui_message'

import { ui } from 'ui'

export enum PlayerRole {
	UNKNOWN,

	WAITING,
	GAMING,
}

export class PlayerState extends ClientSystem implements System {

	private _role : PlayerRole;
	private _displayName : string;

	constructor(clientId : number) {
		super(SystemType.PLAYER_STATE, clientId);

		this.addNameParams({
			base: "player_state",
			id: clientId,
		})

		this._role = PlayerRole.UNKNOWN;
		this._displayName = "unknown";

		this.addProp<PlayerRole>({
			has: () => { return this._role !== PlayerRole.UNKNOWN; },
			export: () => { return this._role; },
			import: (obj: PlayerRole) => { this._role = obj; },
		})
		this.addProp<string>({
			export: () => { return this.displayName(); },
			import: (obj: string) => { this.setDisplayName(obj); },
		});
		this.addProp<number>({
			has: () => { return this.hasTargetEntity(); },
			export: () => { return this.targetEntity().id(); },
			import: (obj : number) => {
				const [entity, ok] = game.entities().getEntity(obj);
				if (ok) {
					this.setTargetEntity(entity);
				}
			}
		})
	}

	override ready() : boolean { return super.ready() && this._role !== PlayerRole.UNKNOWN; }

	override initialize() : void {
		super.initialize();
	}

	override handleMessage(msg : GameMessage) : void {
		super.handleMessage(msg);

		if (msg.type() === GameMessageType.CLIENT_JOIN) {
			const clientId = msg.getProp<number>(GameProp.CLIENT_ID);
			if (clientId === this.clientId()) {
				const displayName = msg.getProp<string>(GameProp.DISPLAY_NAME);
				this.setDisplayName(displayName);

				let [player, hasPlayer] = game.entities().addEntity<Player>(EntityType.PLAYER, {
					clientId: clientId,
					profileInit: {
		    			pos: {x: 1, y: 10},
					},
		    	});
		    	if (hasPlayer) {
		    		player.setSpawn({x: 1, y: 10});
		    		this.setTargetEntity(player);
			    	this.setRole(PlayerRole.GAMING);
		    	}
			}
		}
	}

	override delete() : void {
		super.delete();

		if (this.hasTargetEntity()) {
			this.targetEntity().delete();
		}

		const uiMsg = new UiMessage(UiMessageType.CLIENT_DISCONNECT);
		uiMsg.setProp(UiProp.CLIENT_ID, this.clientId());
		ui.handleMessage(uiMsg);
	}

	role() : PlayerRole { return this._role; }
	setRole(role : PlayerRole) : void { this._role = role; }

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
}