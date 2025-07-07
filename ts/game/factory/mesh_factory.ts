import * as BABYLON from '@babylonjs/core/Legacy/legacy'
import '@babylonjs/loaders/glTF'

import { game } from 'game'
import { MeshType } from 'game/factory/api'

export type LoadResult = {
	mesh : BABYLON.Mesh;
	meshes? : BABYLON.AbstractMesh[];
	skeletons? : BABYLON.Skeleton[];
	animationGroups? : BABYLON.AnimationGroup[];
	transformNodes? : BABYLON.TransformNode[];
}

export namespace MeshFactory {

	const pathPrefix = "mesh/";
	const fileExtension = ".glb";

	// Cache requirements:
	//  1. no material change
	//  2. no geometry change
	//  3. single mesh (no submesh)
	//  4. read-only for non-mesh results (no references allowed)
	//  5. prefer meshes that require quick load
	const cacheTypes = new Set([
		MeshType.KNIFE,
		MeshType.ROCKET,
		MeshType.STAR,
	]);
	let resultCache = new Map<MeshType, LoadResult>();

	export function load(type : MeshType, cb : (loadResult : LoadResult) => void) : void {
		if (type === MeshType.UNKNOWN) {
			return;
		}

		const fileName = getFileName(type);

		if (isCached(type)) {
			let mesh = resultCache.get(type).mesh.clone(MeshType[type], /*newParent=*/null);
			mesh.isVisible = true;
			mesh.getChildMeshes<BABYLON.Mesh>().forEach((child : BABYLON.Mesh) => {
				child.isVisible = true;
			});
			cb({
				...resultCache.get(type),
				mesh: mesh,
			});
			return;
		}

		BABYLON.SceneLoader.ImportMesh("", pathPrefix, fileName, game.scene(),
			(meshes, particleSystems, skeletons, animationGroups, transformNodes) => {
			const result = {
				mesh: <BABYLON.Mesh>meshes[0],
				meshes: meshes,
				skeletons: skeletons,
				animationGroups: animationGroups,
				transformNodes: transformNodes,
			};
			if (cacheTypes.has(type) && !resultCache.has(type)) {
				let mesh = result.mesh.clone(MeshType[type], /*newParent=*/null);
				mesh.isVisible = false;
				mesh.getChildMeshes<BABYLON.Mesh>().forEach((child : BABYLON.Mesh) => {
					child.isVisible = false;
				});
				resultCache.set(type, {
					...result,
					mesh: mesh,
				});
			}
			cb(result);
		}, /*onProgress=*/null, (scene : BABYLON.Scene, message : string) => {
			console.error(message);
		});
	}

	export function isCached(type : MeshType) : boolean { return resultCache.has(type); }

	function getFileName(type : MeshType) : string {
		return MeshType[type].toLowerCase() + fileExtension;
	}
}
