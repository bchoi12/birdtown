import * as BABYLON from "babylonjs";
import "babylonjs-loaders"

import { game } from 'game'

export enum MeshType {
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

	ARCH_ROOM = "ARCH_ROOM",
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
	particleSystems? : BABYLON.IParticleSystem[];
	skeletons? : BABYLON.Skeleton[];
	animationGroups? : BABYLON.AnimationGroup[];
	transformNodes? : BABYLON.TransformNode[];
}

// TODO: MeshFactory?
class Loader {

	private readonly _meshPrefix = "mesh/";

	private _meshFiles : Map<MeshType, string>;

	constructor() {
		this._meshFiles = new Map();

		for (const mesh in MeshType) {
			if (mesh.length === 0) {
				continue;
			}
			this._meshFiles.set(MeshType[mesh], mesh.toLowerCase() + ".glb");
		}

	}

	load(type : MeshType, cb : (loadResult : LoadResult) => void) {
		if (!this._meshFiles.has(type)) {
			console.error("Error: no file associated with type", type);
			return;
		}

		BABYLON.SceneLoader.ImportMesh("", this._meshPrefix, this._meshFiles.get(type), game.scene(),
			(meshes, particleSystems, skeletons, animationGroups, transformNodes) => {
			cb({
				meshes: meshes,
				particleSystems: particleSystems,
				skeletons: skeletons,
				animationGroups: animationGroups,
				transformNodes: transformNodes,
			});
		});
	}
}

export const loader = new Loader();