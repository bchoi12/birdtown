
import { game } from 'game'
import { GameState, GameObjectState } from 'game/api'
import { AssociationType, ComponentType } from 'game/component/api'
import { StepData } from 'game/game_object'
import { Entity } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Player } from 'game/entity/player'
import { System, ClientSystem } from 'game/system'
import { SystemType, PlayerRole } from 'game/system/api'

import { GameMessage, GameMessageType } from 'message/game_message'

import { ui } from 'ui'
import { DialogType, FeedType, KeyType, KeyState, InfoType, TooltipType } from 'ui/api'

import { isLocalhost } from 'util/common'
import { Timer} from 'util/timer'

export class PlayerState extends ClientSystem implements System {

	private static readonly _disallowRoleChangeStates = new Set([
		GameState.FINISH, GameState.VICTORY, GameState.ERROR,
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

	private static readonly _lastDamageTime = 10000;
	private static readonly _respawnTime = 1500;

	private _targetId : number;
	private _role : PlayerRole;

	private _respawnTimer : Timer;

	constructor(clientId : number) {
		super(SystemType.PLAYER_STATE, clientId);

		this._targetId = 0;
		this._role = PlayerRole.UNKNOWN;
		this._respawnTimer = this.newTimer({
			canInterrupt: false,
		});

		this.setRole(PlayerRole.SPECTATING);

		this.addProp<number>({
			export: () => { return this._targetId; },
			import: (obj : number) => { this._targetId = obj; },
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

	die() : void {
		if (this.validTargetEntity()) {
			this.targetEntity<Player>().die();
		}
	}

	role() : PlayerRole { return this._role; }
	setRole(role : PlayerRole) : void {
		if (this._role === role) {
			return;
		}

		if (PlayerState._disallowRoleChangeStates.has(game.controller().gameState())) {
			return;
		}

		this._role = role;
		this.applyRole();

		let playerStateMsg = new GameMessage(GameMessageType.PLAYER_STATE);
		playerStateMsg.setPlayerRole(this._role);
		playerStateMsg.setClientId(this.clientId());
		game.handleMessage(playerStateMsg);

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
		case PlayerRole.WAITING:
			// TODO: move this to GameMaker somehow
			if (game.controller().gameState() === GameState.SETUP
				|| game.controller().gameState() === GameState.GAME) {
				game.clientDialog(this.clientId()).showDialog(DialogType.LOADOUT);
			}
			player.setState(GameObjectState.DEACTIVATED);
			break;
    	case PlayerRole.SPAWNING:
    		player.setState(GameObjectState.DEACTIVATED);
    		break;
		case PlayerRole.SPECTATING:
			if (game.tablet(this.clientId()).outOfLives()) {
		    	player.setState(GameObjectState.DISABLE_INPUT);
			} else {
				player.setState(GameObjectState.DEACTIVATED);
			}
    		break;   		
    	case PlayerRole.GAMING:
			game.level().spawnPlayer(player);
			player.setState(GameObjectState.NORMAL);
   			break;
		}
	}

	private processKillOn(player : Player) : void {
		if (!this.isSource()) {
			return;
		}

		let tablet = game.tablet(player.clientId());
		tablet.loseLife();

		const [log, hasLog] = player.stats().lastDamager(PlayerState._lastDamageTime);
		if (!hasLog || !log.hasEntityLog()) {
			let feed = new GameMessage(GameMessageType.FEED);
			feed.setFeedType(FeedType.SUICIDE);
			feed.setNames([tablet.displayName()]);
			game.announcer().broadcast(feed);
			return;
		}

		// Update tablet for last damager.
		const associations = log.entityLog().associations();
		if (associations.has(AssociationType.OWNER)) {
			const damagerId = associations.get(AssociationType.OWNER);
			const [damager, hasDamager] = game.entities().getEntity(damagerId);

			if (hasDamager && game.tablets().hasTablet(damager.clientId())) {
				const damagerTablet = game.tablet(damager.clientId())
				damagerTablet.addInfo(InfoType.KILLS, 1);

				let feed = new GameMessage(GameMessageType.FEED);
				feed.setFeedType(FeedType.KILL);
				feed.setNames([damagerTablet.displayName(), tablet.displayName()]);
				game.announcer().broadcast(feed);
			}
		}
	}

	override handleMessage(msg : GameMessage) : void {
		super.handleMessage(msg);

		switch (msg.type()) {
		case GameMessageType.GAME_STATE:
			switch (msg.getGameState()) {
			case GameState.FREE:
				if (this.hasTargetEntity()) {
					this.setRole(PlayerRole.GAMING);
				}
				break;
			}
			break;
		case GameMessageType.LEVEL_LOAD:
			if (this.validTargetEntity()) {
				game.level().spawnPlayer(this.targetEntity<Player>());
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
			ui.showTooltip(TooltipType.SPAWN, {
				ttl: 100,
			});
		}

		if (!this.isSource()) {
			return;
		}

		// Handle if no target entity yet
		if (!this.hasTargetEntity()) {
			if (game.controller().gameState() === GameState.FREE && game.tablet(this.clientId()).isSetup()) {
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

					if (isLocalhost()) {
						console.log("%s: created player for %d", this.name(), this.clientId());
					}
		    	}
			} else {
				this.setRole(PlayerRole.SPECTATING);
			}
		}
	}

	override update(stepData : StepData) : void {
		super.update(stepData);

		if (!this.isSource() || !this.hasTargetEntity()) {
			return;
		}

		let player = this.targetEntity<Player>();

		if (this.role() === PlayerRole.WAITING) {
			if (game.controller().gameState() === GameState.GAME
				&& game.clientDialog(player.clientId()).inSync(DialogType.LOADOUT)) {
				this.setRole(PlayerRole.SPAWNING);
			}
		}

		// Allow player to spawn by pressing a key
		if (this.role() === PlayerRole.SPAWNING) {
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

		// Respawn logic
		if (player.dead() && !this._respawnTimer.hasTimeLeft() && this.role() === PlayerRole.GAMING) {
			switch (game.controller().gameState()) {
			case GameState.FREE:
				this._respawnTimer.start(PlayerState._respawnTime, () => {
					game.level().spawnPlayer(player);
				});
				break;
			case GameState.GAME:
				this.processKillOn(player);
				this._respawnTimer.start(PlayerState._respawnTime, () => {
					if (!game.tablet(this.clientId()).outOfLives()) {
						this.setRole(PlayerRole.WAITING);
					} else {
						this.setRole(PlayerRole.SPECTATING);
					}
				});	
				break;
			}
		}
	}
}