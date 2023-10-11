import * as BABYLON from '@babylonjs/core/Legacy/legacy'

type SoundFn = () => BABYLON.Sound;

export class SoundHandler {

	private _sounds : Map<number, SoundFn>;

	constructor() {

	}
}