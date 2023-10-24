
import { game } from 'game'
import { GameState, GameObjectState, PlayerRole } from 'game/api'
import { AssociationType } from 'game/component/api'
import { StepData } from 'game/game_object'
import { Entity } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Player } from 'game/entity/player'
import { System, ClientSystem } from 'game/system'
import { SystemType } from 'game/system/api'

import { GameMessage, GameMessageType } from 'message/game_message'
import { UiMessage, UiMessageType } from 'message/ui_message'

import { ui } from 'ui'

import { isLocalhost } from 'util/common'
import { Timer, InterruptType } from 'util/timer'

export class PlayerState extends ClientSystem implements System {

	private static readonly _respawnTime = 2000;

	private _role : PlayerRole;
	private _points : number;
	private _displayName : string;

	private _respawnTimer : Timer;

	constructor(clientId : number) {
		super(SystemType.PLAYER_STATE, clientId);

		this._role = PlayerRole.UNKNOWN;
		this._points = 0;
		this._displayName = "unknown";
		this._respawnTimer = this.newTimer({
			interrupt: InterruptType.UNSTOPPABLE,
		});

		this.addProp<PlayerRole>({
			export: () => { return this._role; },
			import: (obj: PlayerRole) => { this.setRole(obj); },
		});
		this.addProp<number>({
			export: () => { return this._points; },
			import: (obj: number) => { this._points = obj; },
		});
		this.addProp<string>({
			export: () => { return this.displayName(); },
			import: (obj: string) => { this.setDisplayName(obj); },
		});
	}

	override setTargetEntity(entity : Entity) : void {
		super.setTargetEntity(entity);
		this.applyRole();
	}

	override handleMessage(msg : GameMessage) : void {
		super.handleMessage(msg);

		switch (msg.type()) {
		case GameMessageType.CLIENT_JOIN:
			const clientId = msg.getClientId();
			if (clientId === this.clientId()) {
				const displayName = msg.getDisplayName();
				this.setDisplayName(displayName);
			}
			break;
		case GameMessageType.GAME_STATE:
			this.applyRole();
			break;
		}
	}

	override delete() : void {
		super.delete();

		if (this.hasTargetEntity()) {
			this.targetEntity().delete();
		}

		const uiMsg = new UiMessage(UiMessageType.CLIENT_DISCONNECT);
		uiMsg.setClientId(this.clientId());
		ui.handleMessage(uiMsg);
	}

	setDisplayName(displayName : string) : void {
		this._displayName = displayName;

		this.addNameParams({
			type: this._displayName,
		});

		const uiMsg = new UiMessage(UiMessageType.CLIENT_JOIN);
		uiMsg.setClientId(this.clientId());
		uiMsg.setDisplayName(this.displayName());
		ui.handleMessage(uiMsg);
	}
	displayName() : string { return this._displayName; }

	resetPoints() : void { this._points = 0; }
	addPoints(points : number) : void { this._points += points; }
	points() : number { return this._points; }

	role() : PlayerRole { return this._role; }
	setRole(role : PlayerRole) : void {
		if (this._role === role) {
			return;
		}

		this._role = role;
		this.applyRole();

		if (isLocalhost()) {
			console.log("%s: player role is %s", this.name(), PlayerRole[role]);
		}
	}
	applyRole() : void {
		if (!this.hasTargetEntity()) {
			return;
		}

		switch (this._role) {
		case PlayerRole.WAITING:
	    	this.targetEntity().setState(GameObjectState.DEACTIVATED);
    		break;
    	case PlayerRole.GAMING:
	    	this.targetEntity().setState(GameObjectState.NORMAL);

    		switch (game.controller().gameState()) {
    		case GameState.SETUP:
    			this.targetEntity().setState(GameObjectState.DISABLE_INPUT);
    			break;
		    default:
    			this.targetEntity().setState(GameObjectState.NORMAL);
		    	break;
    		}
    		break;
		}
	}

	override preUpdate(stepData : StepData) : void {
		super.preUpdate(stepData);

		if (!this.isSource()) {
			return;
		}

		if (!this.hasTargetEntity() && game.controller().gameState() === GameState.FREE) {
			let [player, hasPlayer] = game.entities().addEntity<Player>(EntityType.PLAYER, {
				clientId: this.clientId(),
				associationInit: {
					associations: new Map([
						[AssociationType.TEAM, 1 + (this.clientId() % 2)],
					]),
				},
				profileInit: {
	    			pos: game.level().defaultSpawn(),
				},
	    	});
	    	if (hasPlayer) {
	    		this.setTargetEntity(player);
		    	this.setRole(PlayerRole.GAMING);
	    	}
		}

		if (this.hasTargetEntity()) {
			switch (game.controller().gameState()) {
			case GameState.FREE:
				let player = this.targetEntity<Player>();
				if (player.dead()) {
					this._respawnTimer.start(PlayerState._respawnTime, () => {
						game.level().spawnPlayer(player);
					});
				}
				break;
			}
		}
	}
}