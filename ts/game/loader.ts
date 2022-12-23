import * as BABYLON from "babylonjs";
import "babylonjs-loaders"

import { game } from 'game'

import { defined } from 'util/common'

export enum ModelType {
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

export interface LoadResult {
	meshes? : BABYLON.AbstractMesh[];
	skeletons? : BABYLON.Skeleton[];
	animationGroups? : BABYLON.AnimationGroup[];
	transformNodes? : BABYLON.TransformNode[];
}

class Loader {

	private readonly _modelPrefix = "model/";

	private _modelFiles : Map<ModelType, string>;

	constructor() {
		this._modelFiles = new Map();

		for (const model in ModelType) {
			if (model.length === 0) {
				continue;
			}
			this._modelFiles.set(ModelType[model], model.toLowerCase() + ".glb");
		}

	}

	load(model : ModelType, cb : (loadResult : LoadResult) => void) {
		if (!this._modelFiles.has(model)) {
			console.error("Error: no file associated with " + model);
			return;
		}

		BABYLON.SceneLoader.ImportMesh("", this._modelPrefix, this._modelFiles.get(model), game.scene(), (meshes, particleSystems, skeletons, animationGroups, transformNodes) => {
			cb({
				meshes: meshes,
				skeletons: skeletons,
				animationGroups: animationGroups,
				transformNodes: transformNodes,
			});
		});
	}
}

export const loader = new Loader();