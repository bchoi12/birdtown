import * as BABYLON from '@babylonjs/core/Legacy/legacy'
import * as MATTER from 'matter-js'

import { game } from 'game'
import { Model } from 'game/component/model'
import { Profile } from 'game/component/profile'
import { EntityOptions } from 'game/entity'
import { Particle } from 'game/entity/particle'
import { EntityType } from 'game/entity/api'
import { StepData } from 'game/game_object'
import { CollisionCategory, ParticleType } from 'game/factory/api'
import { BodyFactory } from 'game/factory/body_factory'

import { GameGlobals } from 'global/game_globals'

import { Fns, InterpType } from 'util/fns'
import { Vec2 } from 'util/vector'

export class TextParticle extends Particle {

	private static readonly _defaultFont = "24pt Impact";
	private static readonly _defaultTextColor = "#FFFFFF";

	private _text : string;
	private _font : string;
	private _textColor : string;
	private _texture : BABYLON.DynamicTexture;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.TEXT_PARTICLE, entityOptions);

		this._text = "";
		this._font = TextParticle._defaultFont;
		this._textColor = TextParticle._defaultTextColor;
		this._texture = new BABYLON.DynamicTexture(this.name() + "-text", 64, game.scene());
		this._texture.hasAlpha = true;
	}

	override bodyFn(profile : Profile) : MATTER.Body {
		return BodyFactory.circle(profile.pos(), profile.unscaledDim(), {
			collisionFilter: BodyFactory.collisionFilter(CollisionCategory.TEXT_PARTICLE),
		});
	}

	override ready() : boolean { return this._text.length > 0 && super.ready(); }

	setText(text : string) : void {
		this._text = text;
	}
	setFont(font : string) : void {
		this._font = font;
	}
	setTextColor(color : string) : void {
		this._textColor = color;
	}

	override renderShadows() : boolean { return true; }
	override particleType() : ParticleType { return ParticleType.PLANE; }
	override processModel(model : Model) : void {
		/*
		let textureCtx = this._texture.getContext();
		textureCtx.font = this._font;
		textureCtx.strokeStyle = '#000000';
	    textureCtx.lineWidth = 8;
	    textureCtx.strokeText(this._text, null, null);
	    textureCtx.fillStyle = this._textColor;
	    textureCtx.fillText(this._text, null, null);
	    textureCtx.stroke();
	    */

		this._texture.drawText(this._text, /*x=*/null, /*y=*/null, this._font, this._textColor, "#00000000", false);

		model.mesh().renderingGroupId = 1;
		model.mesh().receiveShadows = false;
		model.mesh().rotation.z = Math.PI;
		model.mesh().billboardMode = BABYLON.AbstractMesh.BILLBOARDMODE_ALL;

		let material = model.material<BABYLON.StandardMaterial>()
		material.diffuseTexture = this._texture;
		material.useAlphaFromDiffuseTexture = true;
	}
	override updateParticle(stepData : StepData) : void {
		if (!this.model().hasMesh()) {
			return;
		}

		this.model().material().alpha = 1 - Fns.interp(InterpType.SUDDEN_END_70, this.ttlElapsed());
		
	}
}