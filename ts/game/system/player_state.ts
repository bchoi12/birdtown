
import { game } from 'game'
import { GameState, GameObjectState } from 'game/api'
import { ComponentType, AttributeType } from 'game/component/api'
import { StepData } from 'game/game_object'
import { Entity } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { TextParticle } from 'game/entity/particle/text_particle'
import { Player } from 'game/entity/player'
import { System, ClientSystem } from 'game/system'
import { SystemType, PlayerRole } from 'game/system/api'

import { GameMessage, GameMessageType } from 'message/game_message'

import { ui } from 'ui'
import { InfoType, KeyType, KeyState, StatusType, TooltipType } from 'ui/api'

import { isLocalhost } from 'util/common'
import { Optional } from 'util/optional'
import { Timer } from 'util/timer'

export class PlayerState extends ClientSystem implements System {

	private static readonly _defaultChatColor = "#FFFFFF";

	private static readonly _disallowRoleChangeStates = new Set([
		GameState.PRELOAD, GameState.FINISH, GameState.VICTORY, GameState.ERROR
	]);
	private static readonly _gameRoles = new Set([
		PlayerRole.PREPARING, PlayerRole.SPAWNING, PlayerRole.GAMING, PlayerRole.WAITING,
	]);

	private static readonly _spawnKeys = [
		KeyType.LEFT,
		KeyType.RIGHT,
		KeyType.JUMP,
		KeyType.INTERACT,
		KeyType.SQUAWK,
		KeyType.MOUSE_CLICK,
		KeyType.ALT_MOUSE_CLICK,
	];

	// Time in airplane
	private static readonly _spawnTime = 5000;

	// Time dead
	private static readonly _respawnTime = 2000;

	private _disconnected : boolean;
	private _targetId : number;
	private _startingRole : PlayerRole;
	private _team : number;
	private _role : PlayerRole;
	private _roleTimer : Timer;
	private _lastChange : number;

	constructor(clientId : number) {
		super(SystemType.PLAYER_STATE, clientId);

		this._disconnected = false;
		this._targetId = 0;
		this._role = PlayerRole.UNKNOWN;
		this._roleTimer = this.newTimer({
			canInterrupt: false,
		});

		this._startingRole = PlayerRole.UNKNOWN;
		this._team = 0;
		this._role = PlayerRole.UNKNOWN;
		this._lastChange = Date.now();

		this.setStartingRole(PlayerRole.SPECTATING);
		this.setRole(PlayerRole.SPECTATING);

		this.addProp<boolean>({
			has: () => { return this._disconnected; },
			export: () => { return this._disconnected; },
			import: (obj : boolean) => { this.setDisconnected(obj); },
		});
		this.addProp<number>({
			export: () => { return this._targetId; },
			import: (obj : number) => { this._targetId = obj; },
		});
		this.addProp<PlayerRole>({
			export: () => { return this._startingRole; },
			import: (obj: PlayerRole) => { this.setStartingRole(obj); },
		});
		this.addProp<number>({
			export: () => { return this._team; },
			import: (obj : number) => { this.setTeam(obj); },
		});
		this.addProp<PlayerRole>({
			export: () => { return this._role; },
			import: (obj: PlayerRole) => { this.setRole(obj); },
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
	}

	disconnected() : boolean { return this._disconnected; }
	setDisconnected(disconnected : boolean) : void {
		this._disconnected = disconnected;

		if (this._disconnected) {
			ui.removePlayer(this.clientId());
		}
	}
	role() : PlayerRole { return this._role; }
	inGame() : boolean { return PlayerState._gameRoles.has(this._startingRole) && PlayerState._gameRoles.has(this._role); }
	isSpectating() : boolean { return this._role === PlayerRole.SPECTATING; }
	setStartingRole(role : PlayerRole) : void {
		this._startingRole = role;

		if (!this.isPlaying() && game.controller().gameState() !== GameState.FREE) {
			ui.removePlayer(this.clientId());
		}
	}
	waitUntil(role : PlayerRole, millis : number, cb? : () => void) : void {
		this.setRole(PlayerRole.WAITING);
		this._roleTimer.start(millis, () => {
			this.setRole(role);
			if (cb) {
				cb();
			}
		});
	}
	setRole(role : PlayerRole) : void {
		if (this._role === role) {
			return;
		}

		if (PlayerState._disallowRoleChangeStates.has(game.controller().gameState())) {
			return;
		}

		if (role === PlayerRole.UNKNOWN) {
			console.error("Warning: skipping setting role to UNKNOWN for %s", this.name());
			return;
		}

		this._roleTimer.reset();
		this._role = role;
		this._lastChange = Date.now();
		this.applyRole();

		if (isLocalhost()) {
			console.log("%s: player role is %s", this.name(), PlayerRole[role]);
		}
	}
	applyRole() : void {
		if (!this.hasTargetEntity()) {
			return;
		}

		this.updateScoreboard();

		let player = this.targetEntity<Player>();

		// This should be idempotent
		switch (this._role) {
		case PlayerRole.PREPARING:
			player.setState(GameObjectState.DEACTIVATED);
			break;
    	case PlayerRole.SPAWNING:
    		player.setState(GameObjectState.DEACTIVATED);
    		break;
    	case PlayerRole.GAMING:
    		player.setState(GameObjectState.NORMAL);
   			break;
		case PlayerRole.WAITING:
		case PlayerRole.SPECTATING:
			if (player.dead()) {
		    	player.setState(GameObjectState.DISABLE_INPUT);
			} else {
				player.setState(GameObjectState.DEACTIVATED);
			}
			break;
		}
	}
	timeInRole() : number { return Date.now() - this._lastChange; }
	isPlaying() : boolean {
		if (this._disconnected) {
			return false;
		}
		if (game.controller().gameState() === GameState.FREE) {
			return true;
		}

		if (this._startingRole === PlayerRole.SPECTATING) {
			return false;
		}
		if (!game.tablets().hasTablet(this.clientId())) {
			return false;
		}
		if (!game.clientDialogs().hasClientDialog(this.clientId())) {
			return false;
		}
		return true;
	}
	team() : number { return this._team; }
	setTeam(team : number) : void {
		this._team = team;

		if (this.hasTargetEntity()) {
			this.targetEntity().setTeam(this._team);
		}
	}
	private updateScoreboard() : void {
		if (this.isPlaying() || game.controller().gameState() === GameState.FREE) {
			if (game.tablets().hasTablet(this.clientId()) && game.tablet(this.clientId()).isSetup()) {
				ui.addPlayer(this.clientId());
			}
		} else {
			ui.removePlayer(this.clientId());
		}
	}

	private canSpawn() : boolean {
		return this.role() === PlayerRole.SPAWNING
			&& this.hasTargetEntity()
			&& game.controller().gameState() === GameState.GAME;
	}
	// Immediate spawn
	private autoSpawn() : boolean {
		return this.canSpawn() && game.level().hasSpawnFor(this.targetEntity());
	}
	// Player can spawn && we should show prompt since they need to press a button.
	private promptSpawn() : boolean {
		return this.canSpawn() && !game.level().hasSpawnFor(this.targetEntity());
	}
	spawnPlayer() : void {
		if (!this.hasTargetEntity()) {
			return;
		}
		let player = this.targetEntity<Player>();
		player.setTeam(this._team);
		game.level().spawnPlayer(player);
    	this.setRole(PlayerRole.GAMING);
	}
	resetForLobby() : void {
		if (this.validTargetEntity()) {
			this._roleTimer.reset();

			let player = this.targetEntity<Player>();
			this.spawnPlayer();
		}
	}
	onStartRound() : void {
		if (!this.validTargetEntity()) {
			return;
		}

		this.targetEntity<Player>().setAttribute(AttributeType.REVIVING, false);
		this.targetEntity<Player>().fullHeal();
		this.setRole(this._startingRole);
	}
	die() : void {
		if (this.validTargetEntity()) {
			this.targetEntity<Player>().die();
		}
	}

	chat(msg : string) : void {
		if (!this.activeTargetEntity()) {
			return;
		}

		const offset = this.targetEntity().isLakituTarget() ? 0.5 : 1.2;

		const [particle, hasParticle] = this.addEntity<TextParticle>(EntityType.TEXT_PARTICLE, {
			offline: true,
			ttl: 5000,
			profileInit: {
				pos: this.targetEntity().profile().pos().clone().add({
					y: this.targetEntity().profile().dim().y / 2 + offset,
				}),
				vel: { x: 0, y: 0.01 },
			},
		});

		if (hasParticle) {
			particle.setText({
				text: msg,
				textColor: this.targetEntity().clientColorOr(PlayerState._defaultChatColor),
				height: 1,
				renderOnTop: true,
			});
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

		if (!this.isSource()) {
			return;
		}

		// Spawn the player if we meet a long list of criteria.
		if (!this.hasTargetEntity()) {
			if (game.tablet(this.clientId()).isSetup()
				&& game.controller().gameState() === GameState.FREE) {
				let [player, hasPlayer] = game.entities().addEntity<Player>(EntityType.PLAYER, {
					clientId: this.clientId(),
					profileInit: {
		    			pos: game.level().defaultSpawn(),
					},
		    	});
		    	if (hasPlayer) {
		    		this.setTargetEntity(player);
		    		this._targetId = player.id();
		    		this.spawnPlayer();

					if (isLocalhost()) {
						console.log("%s: created player for %d", this.name(), this.clientId());
					}
		    	}
			}
		} else {
			if (this.role() !== PlayerRole.GAMING
				&& this.targetEntity().getAttribute(AttributeType.REVIVING)
				&& this.targetEntity().healthPercent() > 0.99) {
				if (game.tablet(this.clientId()).outOfLives()) {
					game.tablet(this.clientId()).addInfo(InfoType.LIVES, 1);
				}
				this.spawnPlayer();
			}

			if (game.controller().gameState() === GameState.GAME
				&& this.isPlaying()
				&& this.role() === PlayerRole.SPAWNING
				&& this.timeInRole() >= game.controller().config().getSpawnTimeOr(PlayerState._spawnTime)) {
				this.spawnPlayer();
			}
		}
	}

	override update(stepData : StepData) : void {
		super.update(stepData);

		if (!this.isSource() || !this.hasTargetEntity()) {
			return;
		}

		if (this.autoSpawn()) {
			this.spawnPlayer();
		} else if (this.promptSpawn()) {
			// Allow player to spawn by pressing a key
			if (this.anyKey(PlayerState._spawnKeys, KeyState.PRESSED)) {
				this.spawnPlayer();
			}
		}
	}

	override postUpdate(stepData : StepData) : void {
		super.postUpdate(stepData);

		if (!this.isSource() || !this.validTargetEntity()) {
			return;
		}

		let player = this.targetEntity<Player>();

		// Free respawn in the lobby
		if (player.dead() && game.controller().gameState() === GameState.FREE) {
			this.setRole(PlayerRole.WAITING);
			this.waitUntil(PlayerRole.GAMING, PlayerState._respawnTime, () => {
				this.spawnPlayer();
			});
		}
	}

	override preRender() : void {
		super.preRender();

		if (!this.clientIdMatches() || !this.validTargetEntity()) {
			return;
		}

		let player = this.targetEntity<Player>();

		if (this.promptSpawn()) {
			ui.showTooltip(TooltipType.SPAWN, {});
   			ui.setTimer(Math.max(0, game.controller().config().getSpawnTimeOr(PlayerState._spawnTime) - this.timeInRole()));
		} else {
			ui.hideTooltip(TooltipType.SPAWN);

			// This is kind of broad
			ui.clearTimer();
		}
	}
}