import * as BABYLON from "babylonjs";
import "babylonjs-loaders"

import { game } from 'game'

export enum Model {
	UNKNOWN = "",
	CHICKEN = "CHICKEN",
	DUCK = "DUCK",

	UZI = "UZI",
	BAZOOKA = "BAZOOKA",
	SNIPER = "SNIPER",
	STAR_GUN = "STAR_GUN",

	ROCKET = "ROCKET",

	COWBOY_HAT = "COWBOY_HAT",
	JETPACK = "JETPACK",
	HEADBAND = "HEADBAND",
	SCOUTER = "SCOUTER",

	ARCH_BASE = "ARCH_BASE",
	ARCH_ROOF = "ARCH_ROOF",
	ARCH_BALCONY = "ARCH_BALCONY",
	TABLE = "TABLE",

	BEACH_BALL = "BEACH_BALL",
	TRASH_CAN = "TRASH_CAN",
	POTTED_TREE = "POTTED_TREE",
}

export enum Texture {
	UNKNOWN = "",
	WATER_NORMALS = "WATER_NORMALS",
	SAND = "SAND",
}

class Loader {

	private readonly _modelPrefix = "model/";

	private _modelFiles : Map<Model, string>;

	constructor() {
		this._modelFiles = new Map();

		for (const model in Model) {
			if (model.length === 0) {
				continue;
			}
			this._modelFiles.set(Model[model], model.toLowerCase() + ".glb");
		}

	}

	load(model : Model, cb : (mesh: BABYLON.Mesh) => void) {
		if (!this._modelFiles.has(model)) {
			console.error("Error: no file associated with " + model);
			return;
		}

		BABYLON.SceneLoader.ImportMesh("", this._modelPrefix, this._modelFiles.get(model), game.scene(), (meshes) => {
			cb(<BABYLON.Mesh>meshes[0]);
		});
	}
}

export const loader = new Loader();