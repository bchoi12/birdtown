import * as BABYLON from '@babylonjs/core/Legacy/legacy'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { GameMode } from 'game/api'
import { StepData } from 'game/game_object'
import { Model } from 'game/component/model'
import { Profile } from 'game/component/profile'
import { Entity, EntityBase, EntityOptions } from 'game/entity'
import { EntityType } from 'game/entity/api'
import { BodyFactory } from 'game/factory/body_factory'

import { UiMessage, UiMessageType } from 'message/ui_message'

import { ui } from 'ui'
import { DialogButtonAction, DialogType, DialogButtonType, KeyType, KeyState, TooltipType } from 'ui/api'

export class Console extends EntityBase implements Entity {

	private _active : boolean;

	private _model : Model;
	private _profile : Profile;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.CONSOLE, entityOptions);

		this._active = false;

		this.addProp<boolean>({
			export: () => { return this._active; },
			import: (obj : boolean) => { this._active = obj; },
		});

		this._model = this.addComponent<Model>(new Model({
			readyFn: () => {
				return this._profile.ready();
			},
			meshFn: (model : Model) => {
				const dim = this._profile.dim();
				model.setMesh(BABYLON.MeshBuilder.CreateBox(this.name(), {
					width: dim.x,
					height: dim.y,
					depth: 0.5,
				}, game.scene()));

				model.setTranslation(new BABYLON.Vector3(0, 0, -1));
			},
		}));

		this._profile = this.addComponent<Profile>(new Profile({
			bodyFn: (profile : Profile) => {
				return BodyFactory.rectangle(profile.pos(), profile.dim(), {
					isStatic: true,
					isSensor: true,
					render: {
						visible: false,
					},
				});
			},
			init: entityOptions.profileInit,
		}));
	}

	override prePhysics(stepData : StepData) : void {
		super.prePhysics(stepData);

		this._active = false;
	}

	override collide(collision : MATTER.Collision, other : Entity) : void {
		super.collide(collision, other);

		if (other.type() !== EntityType.PLAYER) {
			return;
		}

		if (!other.clientIdMatches()) {
			return;
		}

		this._active = true;
	}

	override postPhysics(stepData : StepData) : void {
		super.postPhysics(stepData);
		const seqNum = stepData.seqNum;

		if (!this._active) {
			return;
		}

		if (this.isSource()) {
			let msg = new UiMessage(UiMessageType.TOOLTIP);
			msg.setTooltipType(TooltipType.CONSOLE);
			msg.setTtl(100);
			ui.handleMessage(msg);

			if (game.keys().getKey(KeyType.INTERACT).pressed()) {
				let msg = new UiMessage(UiMessageType.DIALOG);
				msg.setDialogType(DialogType.PICK_GAME_MODE);
				msg.setPages([{
					buttons: [{
						type: DialogButtonType.IMAGE,
						title: "duel",
						action: DialogButtonAction.SUBMIT,
						onSelect: () => { game.controller().startGame(GameMode.DUEL) },
					}, {
						type: DialogButtonType.IMAGE,
						title: "cancel",
						action: DialogButtonAction.SUBMIT,
					}],
				}]);
				ui.handleMessage(msg);
			}
		}
	}
}