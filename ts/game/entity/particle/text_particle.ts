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
import { ParticleFactory } from 'game/factory/particle_factory'

import { GameGlobals } from 'global/game_globals'
import { UiGlobals } from 'global/ui_globals'

import { Fns, InterpType } from 'util/fns'
import { Vec2 } from 'util/vector'

type TextOptions = {
	text: string;
	height: number;

	alpha? : number;
	font? : string;
	textColor? : string;
	renderOnTop? : boolean;
}

export class TextParticle extends Particle {

	private static readonly _defaultFont = UiGlobals.particleFont;
	private static readonly _defaultTextColor = "#FFFFFF";
	private static readonly _fillColor = "#00000000";
	private static readonly _textureHeight = 64;

	private _text : string;
	private _alpha : number;
	private _font : string;
	private _textColor : string;
	private _textureWidth : number;
	private _renderOnTop : boolean;

	constructor(entityOptions : EntityOptions) {
		super(EntityType.TEXT_PARTICLE, entityOptions);

		this._text = "";
		this._alpha = 1;
		this._font = TextParticle._defaultFont;
		this._textColor = TextParticle._defaultTextColor;
		this._textureWidth = 0;
		this._renderOnTop = false;
	}

	override bodyFn(profile : Profile) : MATTER.Body {
		return BodyFactory.circle(profile.pos(), profile.initDim(), {
			collisionFilter: BodyFactory.collisionFilter(CollisionCategory.TEXT_PARTICLE),
		});
	}

	override ready() : boolean { return this._text.length > 0 && super.ready(); }

	setText(options : TextOptions) : void {
		this._text = options.text;
		const height = options.height

		if (options.alpha) {
			this._alpha = options.alpha;
		}
		if (options.font) {
			this._font = options.font;
		}
		if (options.textColor) {
			this._textColor = options.textColor;
		}
		if (options.renderOnTop) {
			this._renderOnTop = options.renderOnTop;
		}

		let temp = new BABYLON.DynamicTexture(this.name() + "-temp", TextParticle._textureHeight);
		let context = temp.getContext();
		context.font = this._font;
		this._textureWidth = context.measureText(this._text).width;

		const ratio = height / TextParticle._textureHeight;
		const width = ratio * this._textureWidth;

		temp.dispose();

		this._profile.setScaling({
			x: width,
			y: height,
		});
	}

	override particleType() : ParticleType { return ParticleType.PLANE; }
	override processModel(model : Model) : void {
		let texture = new BABYLON.DynamicTexture(this.name() + "-text", {
			width: this._textureWidth,
			height: TextParticle._textureHeight,
		});
		texture.drawText(this._text, /*x=*/null, /*y=*/null, this._font, this._textColor, TextParticle._fillColor, /*invertY=*/true);
		texture.hasAlpha = true;

		let material = new BABYLON.StandardMaterial(this.name() + "-material", game.scene());
		material.diffuseTexture = texture;
		material.alpha = this._alpha;
		material.useAlphaFromDiffuseTexture = true;

		model.mesh().material = material;
		if (this._renderOnTop) {
			model.mesh().renderingGroupId = 1;
		}
		model.mesh().receiveShadows = false;
		// Not needed after Babylon update??
		// model.mesh().rotation.z = Math.PI;
		model.mesh().billboardMode = BABYLON.AbstractMesh.BILLBOARDMODE_ALL;
	}

	override updateParticle(stepData : StepData) : void {
		if (!this.model().hasMesh()) {
			return;
		}

		this.model().material().alpha = this._alpha * (1 - Fns.interp(InterpType.SUDDEN_END_70, this.ttlElapsed()));
	}
}