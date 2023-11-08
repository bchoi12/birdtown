
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
import { KeyType, KeyState, TooltipType } from 'ui/api'

import { isLocalhost } from 'util/common'
import { Timer, InterruptType } from 'util/timer'

export class PlayerState extends ClientSystem implements System {

	private static readonly _respawnTime = 1500;

	private _targetId : number;
	private _role : PlayerRole;
	private _points : number;
	private _displayName : string;

	private _respawnTimer : Timer;

	constructor(clientId : number) {
		super(SystemType.PLAYER_STATE, clientId);

		this._targetId = 0;
		this._role = PlayerRole.UNKNOWN;
		this._points = 0;
		this._displayName = "unknown";
		this._respawnTimer = this.newTimer({
			interrupt: InterruptType.UNSTOPPABLE,
		});

		this.addProp<number>({
			export: () => { return this._targetId; },
			import: (obj : number) => { this._targetId = obj; },
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
		if (entity.type() !== EntityType.PLAYER) {
			console.error("%s: skipping setting non-player entity as target", this.name(), entity.name());
			return;
		}

		super.setTargetEntity(entity);
		this.applyRole();
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

		let player = this.targetEntity<Player>();

		switch (this._role) {
		case PlayerRole.SPECTATING:
		case PlayerRole.WAITING:
    	case PlayerRole.SPAWNING:
	    	player.setState(GameObjectState.DEACTIVATED);
    		break;   		
    	case PlayerRole.GAMING:
			game.level().spawnPlayer(player);
			player.setState(GameObjectState.NORMAL);
   			break;
		}
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
			switch (msg.getGameState()) {
			case GameState.FREE:
				this.setRole(PlayerRole.GAMING);
				break;
			case GameState.SETUP:
				// TODO: this should be set by GameMaker since some clients may be spectating
				this.setRole(PlayerRole.WAITING);
				this.resetPoints();
				break;
			case GameState.GAME:
				// TODO: this should also be set by GameMaker
				this.setRole(PlayerRole.SPAWNING);
				break;
			}
			break;
		}
	}

	override preUpdate(stepData : StepData) : void {
		super.preUpdate(stepData);

		// Update target entity if we should
		if (this._targetId > 0 && (!this.hasTargetEntity() || this.targetEntity().id() !== this._targetId)) {
			const [player, hasPlayer] = game.entities().getEntity(this._targetId);
			if (hasPlayer) {
				this.setTargetEntity(player);
			}
		}

		// Show tooltip if we can spawn
		if (this.clientIdMatches() && this.role() === PlayerRole.SPAWNING) {
			let tooltipMsg = new UiMessage(UiMessageType.TOOLTIP);
			tooltipMsg.setTooltipType(TooltipType.SPAWN);
			tooltipMsg.setTtl(100);
			ui.handleMessage(tooltipMsg);
		}

		if (!this.isSource()) {
			return;
		}

		// Handle if no target entity yet
		if (!this.hasTargetEntity()) {
			if (game.controller().gameState() === GameState.FREE) {
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
		    		this._targetId = player.id();
			    	this.setRole(PlayerRole.GAMING);
		    	}
			}
			return;
		}

		let player = this.targetEntity<Player>();

		// Allow player to spawn by pressing a key
		if (this.role() === PlayerRole.SPAWNING) {
			if (this.key(KeyType.JUMP, KeyState.PRESSED)) {
				this.setRole(PlayerRole.GAMING);
			}
		}

		// Respawn logic
		if (player.dead() && !this._respawnTimer.hasTimeLeft() && this.role() === PlayerRole.GAMING) {
			switch (game.controller().gameState()) {
			case GameState.FREE:
				this._respawnTimer.start(PlayerState._respawnTime, () => {
					player.respawn(game.level().defaultSpawn());
				});
				break;
			case GameState.GAME:
				this._respawnTimer.start(PlayerState._respawnTime, () => {
					this.setRole(PlayerRole.SPAWNING);
				});
				break;
			}
		}
	}
}