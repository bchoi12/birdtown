import * as MATTER from 'matter-js'

import { game } from 'game'
import { GameState, GameObjectState } from 'game/api'
import { StepData } from 'game/game_object'
import { AttributeType } from 'game/component/api'
import { Entity, EntityOptions, InteractEntity } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { Bird } from 'game/entity/bird'
import { Equip } from 'game/entity/equip'
import { Beak } from 'game/entity/equip/beak'
import { Bubble } from 'game/entity/equip/bubble'
import { TextParticle } from 'game/entity/particle/text_particle'
import { ColorType, StatType } from 'game/factory/api'
import { ColorFactory } from 'game/factory/color_factory'

import { ui } from 'ui'
import { HudType, HudOptions, InfoType, KeyType, KeyState, TooltipType } from 'ui/api'

import { Fns } from 'util/fns'
import { Optional } from 'util/optional'
import { RateLimiter } from 'util/rate_limiter'
import { Vec2, Vec3 } from 'util/vector'

export class Player extends Bird implements InteractEntity {

	private static readonly _heartInterval = 1000;
	private static readonly _interactCheckInterval = 100;
	private static readonly _reviveTime = 5000;

	private _nearestInteractable : Optional<InteractEntity>;
	private _interactRateLimiter : RateLimiter;

	private _heartRateLimiter : RateLimiter;
	private _reviverId : number;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.PLAYER, entityOptions);

		this.addType(EntityType.INTERACTABLE);

		this._nearestInteractable = new Optional();
		this._interactRateLimiter = new RateLimiter(Player._interactCheckInterval);

		this._heartRateLimiter = new RateLimiter(Player._heartInterval);
		this._reviverId = 0;

		this.addProp<number>({
			export: () => { return this._doubleJumps; },
			import: (obj : number) => { this._doubleJumps = obj; },
		});
		this.addProp<GameObjectState>({
			export: () => { return this.state(); },
			import: (obj : GameObjectState) => { this.setState(obj); },
		});
		this.addProp<number>({
			export: () => { return this._reviverId; },
			import: (obj : number) => { this.importReviverId(obj); },
		});
	}

	override ready() : boolean {
		return super.ready()
			&& this.hasClientId()
			&& game.tablets().hasTablet(this.clientId())
			&& game.tablet(this.clientId()).isSetup();
	}

	override initialize() : void {
		super.initialize();

		game.keys(this.clientId()).setTargetEntity(this);
	}

	onStartRound() : void {
		this.setAttribute(AttributeType.REVIVING, false);
		this.fullHeal();
		this._buffs.refresh();
	}
	floatRespawn(spawn : Vec2) : void {
		this.respawn(spawn);

		if (this.isSource()) {
			this._entityTrackers.clearEntityType(EntityType.BUBBLE);
			const [bubble, hasBubble] = this.addEntity<Bubble>(EntityType.BUBBLE, {
				associationInit: {
					owner: this,
				},
				clientId: this.clientId(),
				levelVersion: game.level().version(),
			});
			if (hasBubble) {
				this._entityTrackers.trackEntity<Bubble>(EntityType.BUBBLE, bubble);
			}
		}
	}

	override displayName() : string { return game.tablet(this.clientId()).displayName(); }
	protected override walkDir() : number {
		if (this.key(KeyType.LEFT, KeyState.DOWN)) {
			return -1;
		} else if (this.key(KeyType.RIGHT, KeyState.DOWN)) {
			return 1;
		}
		return 0;
	}
	protected override jumping() : boolean {
		return this.key(KeyType.JUMP, KeyState.DOWN);
	}
	protected override doubleJumping() : boolean {
		return this.key(KeyType.JUMP, KeyState.PRESSED);
	}
	protected override reorient() : void {
		const dir = this.inputDir();
		if (Math.sign(dir.x) !== Math.sign(this._headDir.x)) {
			if (Math.abs(dir.x) > 0.2) {
				this._headDir.copy(dir);
			}
		} else {
			this._headDir.copy(dir);
		}

		if (Math.abs(this._headDir.x) < .707) {
			this._headDir.x = Math.sign(this._headDir.x);
			this._headDir.y = Math.sign(this._headDir.y);
		}
		this._headDir.normalize();
		this._armDir.copy(dir).normalize();
	}

	override getHudData() : Map<HudType, HudOptions> {
		let hudData = super.getHudData();

		const tablet = game.tablet(this.clientId());
		hudData.set(HudType.HEALTH, {
			percentGone: 1 - this._resources.healthPercent(),
			count: Math.ceil(this._resources.health()),
			keyLives: tablet.getInfo(InfoType.LIVES),
		});

		this._entityTrackers.getEntities<Beak>(EntityType.BEAK).execute((beak : Beak) => {
			beak.getHudData().forEach((counter : HudOptions, type : HudType) => {
				hudData.set(type, counter);
			});
		});

		if (this._entityTrackers.hasEntityType(EntityType.BEAK) && this.clientIdMatches()) {
			hudData.set(HudType.MOUSE_LOCK, {
				charging: !ui.pointerLocked(),
				empty: true,
				keyType: KeyType.POINTER_LOCK,
			});
		}

		this._entityTrackers.getEntities<Equip<Bird>>(EntityType.EQUIP).execute((equip : Equip<Bird>) => {
			equip.getHudData().forEach((counter : HudOptions, type : HudType) => {
				hudData.set(type, counter);
			});
		});
		return hudData;
	}
	override cameraOffset() : Vec3 {
		let pos = super.cameraOffset();
		this.equips().execute((equip : Equip<Bird>) => {
			pos.add(equip.cameraOffset());
		});
		this._entityTrackers.getEntities<Bubble>(EntityType.BUBBLE).executeFirst((bubble : Bubble) => {
			pos.add(bubble.cameraOffset());
		}, (bubble : Bubble) => {
			return true;
		});
		return pos;
	}

	protected override onDamage(dmg : number) : void {
		super.onDamage(dmg);

		if (this.isLakituTarget()) {
			const time = this.damageToTime(dmg);
			game.lakitu().shake(time);
			ui.flashScreen(ColorFactory.toString(ColorType.BLACK), 3 * time);
		}
	}

	override update(stepData : StepData) : void {
		super.update(stepData);
		const millis = stepData.millis;

		if (this.dead() && this.getAttribute(AttributeType.REVIVING)) {
			let amount = this._resources.maxHealth() * millis / Player._reviveTime;

			const [reviver, hasReviver] = game.entities().getEntity(this._reviverId);
			if (hasReviver) {
				if (reviver.hasStat(StatType.REVIVE_BOOST)) {
					amount *= Math.max(0.1, 1 + reviver.getStat(StatType.REVIVE_BOOST));
				}					
			}
			this.heal(amount);
		}

		if (this.getAttribute(AttributeType.BUBBLED) && this._entityTrackers.hasEntityType(EntityType.BUBBLE)) {
			if (this.jumping()) {
				this._entityTrackers.getEntities<Bubble>(EntityType.BUBBLE).execute((bubble : Bubble) => {
					bubble.pop();
				});
			} else {
				if (this.isLakituTarget()
					&& !this.getAttribute(AttributeType.GROUNDED)
					&& this.clientIdMatches()
					&& game.controller().gameState() === GameState.GAME) {
					ui.showTooltip(TooltipType.BUBBLE, {});
				}
			}
		} else if (this.isLakituTarget() && this.clientIdMatches() || this.getAttribute(AttributeType.GROUNDED)) {
			ui.hideTooltip(TooltipType.BUBBLE);
		}
	}

	override postPhysics(stepData : StepData) : void {
		super.postPhysics(stepData);
		const millis = stepData.millis;
		const realMillis = stepData.realMillis;

		// Check for nearby interactables
		if (this._interactRateLimiter.check(realMillis)) {
			// Need to use render position for circular levels
			const pos = this._profile.pos();
			const width = this._profile.width();
			const height = this._profile.height();
			const bounds = MATTER.Bounds.create([
				{ x: pos.x - width / 2 - 1, y: pos.y - height / 2 - 1 },
				{ x: pos.x + width / 2 + 1, y: pos.y - height / 2 - 1 },
				{ x: pos.x + width / 2 + 1, y: pos.y + height / 2 },
				{ x: pos.x - width / 2 - 1, y: pos.y + height / 2 },
			]);
			const bodies = MATTER.Query.region(game.physics().world().bodies, bounds);

			let nearestInteractable : InteractEntity = null;
			let currentDistSq : number = null;
			for (let i = 0; i < bodies.length; ++i) {
				const [entity, ok] = game.physics().queryEntity(bodies[i]);
				if (!ok || !entity.hasType(EntityType.INTERACTABLE) || this.id() === entity.id()) {
					continue;
				}
				const interactable = <InteractEntity>entity;
				const distSq = pos.distSq(entity.profile().pos());
				if (nearestInteractable === null || distSq < currentDistSq) {
					nearestInteractable = interactable;
					currentDistSq = distSq
				}
			}

			// Swap nearest interactable, if any.
			if (this._nearestInteractable.has()) {
				this._nearestInteractable.get().setInteractableWith(this, false);
				this._nearestInteractable.clear();
			}
			if (nearestInteractable !== null) {
				nearestInteractable.setInteractableWith(this, true);
				this._nearestInteractable.set(nearestInteractable);
			}
		}

		// Interact with stuff
		// TODO: put in update?
		if (this._nearestInteractable.has()
			&& this._nearestInteractable.get().canInteractWith(this)
			&& this.key(KeyType.INTERACT, KeyState.PRESSED)) {
			this._nearestInteractable.get().interactWith(this);
			this._interactRateLimiter.prime();
		}

		const healthPercent = this.healthPercent();
		if (this.getAttribute(AttributeType.REVIVING)) {
			const [reviver, hasReviver] = game.entities().getEntity(this._reviverId);

			if (!hasReviver || !reviver.hasType(EntityType.PLAYER)) {
				this.cancelRevive();
			} else {
				const distSq = reviver.profile().pos().distSq(this._profile.pos());
				if (distSq > 4) {
					this.cancelRevive();
				} else {
					if (this.clientIdMatches()) {
						ui.showTooltip(TooltipType.BEING_REVIVED, {
							ttl: 500,
							names: [reviver.displayName(), "" + Math.floor(100 * this.healthPercent())],
						});
					}
					if (reviver.clientIdMatches()) {
						ui.showTooltip(TooltipType.REVIVING, { names: [this.displayName(), "" + Math.floor(100 * this.healthPercent())] });
					}

					if (this._heartRateLimiter.checkPercent(millis, Math.max(0.3, 1 - healthPercent))) {
						const [particle, hasParticle] = this.addEntity<TextParticle>(EntityType.TEXT_PARTICLE, {
							offline: true,
							ttl: 500 + healthPercent * 500,
							profileInit: {
								pos: this._profile.pos().clone().add({ x: Fns.randomNoise(0.3) }),
								vel: { x: 0, y: 0.02 + healthPercent * 0.01 },
							},
						});

						if (hasParticle) {
							particle.setText({
								text: "❤️",
								height: 0.7 + healthPercent * 0.3,
								textColor: ColorFactory.toString(ColorType.RED),
							});
						}
					}
				}
			}
		}
	}

	override getUp() : void {
		super.getUp();

		this.cancelRevive();
	}

	setInteractableWith(entity : Entity, interactable : boolean) : void {
		if (entity.clientIdMatches()) {
			if (interactable && this.canBeRevived(entity)) {
				ui.showTooltip(TooltipType.REVIVE, { ttl: 500, names: [this.displayName()] });
			}
		}
	}
	canInteractWith(entity : Entity) : boolean {
		return this.canBeRevived(entity);
	}
	interactWith(entity : Entity) : void {
		if (this.getAttribute(AttributeType.REVIVING)) {
			return;
		}

		if (this.isSource()) {
			this._reviverId = entity.id();
			this.setAttribute(AttributeType.REVIVING, true);
		}
		if (entity.clientIdMatches()) {
			ui.hideTooltip(TooltipType.REVIVE);
		}
	}

	protected canBeRevived(other : Entity) : boolean {
		if (!game.controller().allowRevives()) {
			return false;
		}
		if (this.id() === other.id()) {
			return false;
		}
		if (!other.hasType(EntityType.PLAYER)) {
			return false;
		}
		if (!this.dead()) {
			return false;
		}
		if (this.getAttribute(AttributeType.REVIVING)) {
			return false;
		}
		if (!this.sameTeam(other)) {
			return false;
		}
		return true;
	}
	revive() : void {
		this.setAttribute(AttributeType.GROUNDED, true);
		this._resources.setHealth(Math.min(300, Math.ceil(0.5 * this.maxHealth())));
		this.getUp();

		const [bubble, hasBubble] = this.addEntity<Bubble>(EntityType.BUBBLE, {
			associationInit: {
				owner: this,
			},
			clientId: this.clientId(),
			levelVersion: game.level().version(),
		});
		if (hasBubble) {
			bubble.hardPop();
		}
	}
	protected cancelRevive() : void {
		this.setAttribute(AttributeType.REVIVING, false);

		const [reviver, hasReviver] = game.entities().getEntity(this._reviverId);
		if (hasReviver && reviver.clientIdMatches()) {
			ui.hideTooltip(TooltipType.REVIVING);
		}

		this._reviverId = 0;
		if (this.clientIdMatches()) {
			ui.hideTooltip(TooltipType.BEING_REVIVED);
		}
	}
	protected importReviverId(id : number) : void {
		if (this._reviverId === id) {
			return;
		}

		const [reviver, hasReviver] = game.entities().getEntity(this._reviverId);
		if (hasReviver && reviver.clientIdMatches()) {
			ui.hideTooltip(TooltipType.REVIVING);
		}

		this._reviverId = id;
	}

}