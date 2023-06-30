import * as BABYLON from "babylonjs";

type SoundFn = () => BABYLON.Sound;

export class SoundHandler {

	private _sounds : Map<number, SoundFn>;

	constructor() {

	}
}