import * as BABYLON from "babylonjs";
import "babylonjs-loaders"

import { game } from 'game'
import { MeshType } from 'game/factory/api'

export type LoadResult = {
	meshes? : BABYLON.AbstractMesh[];
	particleSystems? : BABYLON.IParticleSystem[];
	skeletons? : BABYLON.Skeleton[];
	animationGroups? : BABYLON.AnimationGroup[];
	transformNodes? : BABYLON.TransformNode[];
}

export namespace MeshFactory {

	export const pathPrefix = "mesh/";
	export const fileExtension = ".glb";

	export function load(type : MeshType, cb : (loadResult : LoadResult) => void) {
		const fileName = getFileName(type);
		BABYLON.SceneLoader.ImportMesh("mesh-" + type, pathPrefix, fileName, game.scene(),
			(meshes, particleSystems, skeletons, animationGroups, transformNodes) => {
			cb({
				meshes: meshes,
				particleSystems: particleSystems,
				skeletons: skeletons,
				animationGroups: animationGroups,
				transformNodes: transformNodes,
			});
		}, /*onProgress=*/null, () => {
			console.error("Error: failed to load mesh at", pathPrefix + fileName);
		});
	}

	export function getFileName(type : MeshType) : string {
		return MeshType[type].toLowerCase() + fileExtension;
	}
}
