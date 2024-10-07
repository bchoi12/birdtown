
import { game } from 'game'
import { GameMode, GameState, GameObjectState } from 'game/api'
import { AssociationType, ComponentType } from 'game/component/api'
import { StepData } from 'game/game_object'
import { Entity } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Player } from 'game/entity/player'
import { System, ClientSystem } from 'game/system'
import { SystemType, PlayerRole } from 'game/system/api'

import { GameMessage, GameMessageType } from 'message/game_message'

import { ui } from 'ui'
import { KeyType, KeyState, StatusType, TooltipType } from 'ui/api'

import { isLocalhost } from 'util/common'
import { Optional } from 'util/optional'
import { Timer } from 'util/timer'

export class PlayerState extends ClientSystem implements System {

	private static readonly _disallowRoleChangeStates = new Set([
		GameState.FINISH, GameState.VICTORY, GameState.ERROR,
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

	private static readonly _respawnTime = 1000;
	private static readonly _planeSpawnTime = 7000;

	private _disconnected : boolean;
	private _targetId : number;
	private _startingRole : PlayerRole;
	private _role : PlayerRole;
	private _roleTimer : Timer;

	constructor(clientId : number) {
		super(SystemType.PLAYER_STATE, clientId);

		this._disconnected = false;
		this._targetId = 0;
		this._role = PlayerRole.UNKNOWN;
		this._roleTimer = this.newTimer({
			canInterrupt: false,
		});

		this._startingRole = PlayerRole.UNKNOWN;
		this._role = PlayerRole.UNKNOWN;

		this.setStartingRole(PlayerRole.SPECTATING);
		this.setRole(PlayerRole.SPECTATING);

		this.addProp<boolean>({
			export: () => { return this._disconnected; },
			import: (obj : boolean) => { this._disconnected = obj; },
		});
		this.addProp<number>({
			export: () => { return this._targetId; },
			import: (obj : number) => { this._targetId = obj; },
		});
		this.addProp<PlayerRole>({
			export: () => { return this._startingRole; },
			import: (obj: PlayerRole) => { this.setStartingRole(obj); },
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
	setDisconnected(disconnected : boolean) : void { this._disconnected = disconnected; }
	role() : PlayerRole { return this._role; }
	inGame() : boolean { return PlayerState._gameRoles.has(this._role); }
	setStartingRole(role : PlayerRole) : void {
		this._startingRole = role;

		if (!this.isPlaying() && game.controller().gameState() !== GameState.FREE) {
			ui.removePlayer(this.clientId());
		}
	}
	setRoleAfter(role : PlayerRole, millis : number, cb? : () => void) : void {
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
		this.applyRole();

		if (isLocalhost()) {
			console.log("%s: player role is %s", this.name(), PlayerRole[role]);
		}
	}
	applyRole() : void {
		if (!this.hasTargetEntity()) {
			return;
		}

		if (this.isPlaying() || game.controller().gameState() !== GameState.FREE) {
			ui.addPlayer(this.clientId());
		}

		let player = this.targetEntity<Player>();

		switch (this._role) {
		case PlayerRole.PREPARING:
			player.setState(GameObjectState.DEACTIVATED);
			break;
    	case PlayerRole.SPAWNING:
    		player.setState(GameObjectState.DEACTIVATED);
    		break;
    	case PlayerRole.GAMING:
    		this.spawnPlayer(player);
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

	// Player can spawn && we should show prompt since they need to press a button.
	private promptSpawn() : boolean { return this.role() === PlayerRole.SPAWNING && game.controller().gameState() === GameState.GAME; }
	private spawnPlayer(player : Player) : void {
		game.level().spawnPlayer(player);
		player.setState(GameObjectState.NORMAL);

		if (this.clientIdMatches() && game.controller().gameState() === GameState.FREE) {
			ui.showStatus(StatusType.WELCOME);
			setTimeout(() => {
				ui.hideStatus(StatusType.WELCOME);
				if (game.controller().gameState() === GameState.FREE) {
					ui.showStatus(StatusType.LOBBY);
				}
			}, 7000);
		}
	}
	resetForLobby() : void {
		if (this.validTargetEntity()) {
			this.setRole(PlayerRole.GAMING);
			this._roleTimer.reset();

			let player = this.targetEntity<Player>();
			this.spawnPlayer(player);
		}
	}
	onStartRound() : void {
		if (!this.validTargetEntity()) {
			return;
		}

		this.setRole(this._startingRole);

		// TODO: reset player health
		this.targetEntity<Player>().fullHeal();
	}
	die() : void {
		if (this.validTargetEntity()) {
			this.targetEntity<Player>().die();
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
			    	this.setRole(PlayerRole.GAMING);

					if (isLocalhost()) {
						console.log("%s: created player for %d", this.name(), this.clientId());
					}
		    	}
			}
		}
	}

	override update(stepData : StepData) : void {
		super.update(stepData);

		if (!this.isSource() || !this.hasTargetEntity()) {
			return;
		}

		// Allow player to spawn by pressing a key
		if (this.promptSpawn()) {
			if (this.anyKey(PlayerState._spawnKeys, KeyState.PRESSED)) {
				this.setRole(PlayerRole.GAMING);
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
			this.setRoleAfter(PlayerRole.GAMING, PlayerState._respawnTime);
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
		} else {
			ui.hideTooltip(TooltipType.SPAWN);
		}
	}
}