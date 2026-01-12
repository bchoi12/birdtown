
import { Vec, Vec3 } from 'util/vector'

enum TransformType {
	UNKNOWN,

	TRANSLATE,
	ROTATE,
	SCALE,
}

export type TransformOptions = {
	translate? : Vec;
	rotate? : Vec;
	scale? : Vec;
}

// TODO: move to util?
export class Transforms {

	private static readonly _factory = new Map([
		[TransformType.TRANSLATE, () => { return Vec3.zero(); }],
		[TransformType.ROTATE, () => { return Vec3.zero(); }],
		[TransformType.SCALE, () => { return Vec3.one(); }],
	]);

	private _transforms : Map<TransformType, Vec3>;

	constructor(transformOptions? : TransformOptions) {
		this._transforms = new Map();

		this.setFromOptions(transformOptions);
	}

	setFromOptions(transformOptions? : TransformOptions) {
		if (transformOptions) {
			if (transformOptions.translate) {
				this.setTranslation(transformOptions.translate);
			}
			if (transformOptions.rotate) {
				this.setRotation(transformOptions.rotate);
			}
			if (transformOptions.scale) {
				this.setScaling(transformOptions.scale);
			}
		}
	}

	scale(n : number) : void {
		if (this.hasTranslation()) {
			this.translation().scale(n);
		}
		if (this.hasRotation()) {
			this.rotation().scale(n);
		}
		if (this.hasScaling()) {
			this.scaling().scale(n);
		}
	}
	merge(other : Transforms) : void {
		if (other.hasTranslation()) {
			this.setTranslation(other.translation());
		}
		if (other.hasRotation()) {
			this.setRotation(other.rotation());
		}
		if (other.hasScaling()) {
			this.setScaling(other.scaling());
		}
	}
	reset() : void {
		if (this.hasTranslation()) {
			this.translation().setAll(0);
		}
		if (this.hasRotation()) {
			this.rotation().setAll(0);
		}
		if (this.hasScaling()) {
			this.scaling().setAll(1);
		}
	}

	hasTranslation() : boolean { return this.hasTransform(TransformType.TRANSLATE); }
	translation() : Vec3 { return this.getTransform(TransformType.TRANSLATE); }
	setTranslation(vec : Vec) : void { return this.setTransform(TransformType.TRANSLATE, vec); }

	hasRotation() : boolean { return this.hasTransform(TransformType.ROTATE); }
	rotation() : Vec3 { return this.getTransform(TransformType.ROTATE); }
	setRotation(vec : Vec) : void { return this.setTransform(TransformType.ROTATE, vec); }

	hasScaling() : boolean { return this.hasTransform(TransformType.SCALE); }
	scaling() : Vec3 { return this.getTransform(TransformType.SCALE); }
	setScaling(vec : Vec) : void { return this.setTransform(TransformType.SCALE, vec); }

	private hasTransform(type : TransformType) : boolean { return this._transforms.has(type); }
	private getTransform(type : TransformType) : Vec3 {
		if (!this.hasTransform(type)) {
			this.setTransform(type, Transforms._factory.get(type)());
		}
		return this._transforms.get(type);
	}
	private setTransform(type : TransformType, vec : Vec) : void {
		if (!this.hasTransform(type)) {
			this._transforms.set(type, Transforms._factory.get(type)());
		}
		this._transforms.get(type).copyVec(vec);
	}
}