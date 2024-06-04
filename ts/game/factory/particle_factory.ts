import * as BABYLON from '@babylonjs/core/Legacy/legacy'

import { game } from 'game'
import { ParticleType } from 'game/factory/api'

import { ObjectCache, ObjectCacheOnLoadFn } from 'util/object_cache'

type CreateFn = (index : number) => BABYLON.Mesh;

export namespace ParticleFactory {
	const createFns = new Map<ParticleType, CreateFn>([
		[ParticleType.CUBE, createCube],
		[ParticleType.SMOKE, createSphere],
		[ParticleType.SPARK, createCube],
		[ParticleType.TEAR, createTear],
	]);

	let cache = new Map<ParticleType, ObjectCache<BABYLON.Mesh>>; 
	export function borrowMesh(type : ParticleType, onLoad? : ObjectCacheOnLoadFn<BABYLON.Mesh>) : BABYLON.Mesh {
		if (!cache.has(type)) {
			createCache(type);
		}
		return cache.get(type).borrow(onLoad);
	}

	// Use with caution since meshes are often garbage collected.
	export function returnMesh(type : ParticleType, mesh : BABYLON.Mesh) : void {
		if (!cache.has(type)) {
			createCache(type);
		}
		cache.get(type).return(mesh);
	}

	function createCache(type : ParticleType) : void {
		if (!createFns.has(type)) {
			console.error("Error: no create function defined for", ParticleType[type]);
			return;
		}

		cache.set(type, new ObjectCache({
			createFn: createFns.get(type),
		}));
	}

	function createSphere(index : number) : BABYLON.Mesh {
		const name = "particle-sphere-" + index;
		let sphere = BABYLON.MeshBuilder.CreateSphere(name, { diameter: 1, }, game.scene());
		sphere.material = new BABYLON.StandardMaterial(name, game.scene());
		return sphere;
	}
	function createCube(index : number) : BABYLON.Mesh {
		const name = "particle-cube-" + index;
		let cube = BABYLON.MeshBuilder.CreateBox("particle-cube", { width: 1, height: 1, depth: 1, }, game.scene());
		cube.material = new BABYLON.StandardMaterial(name, game.scene());
		return cube;
	}

	let tearShape = [];
	function createTear(index : number) : BABYLON.Mesh {
		if (tearShape.length === 0) {
			const tearSegments = 10;
			for (let i = 0; i <= tearSegments; ++i) {
				let t = i / tearSegments * Math.PI;
				let x = Math.sin(t / 2);
				tearShape.push(new BABYLON.Vector3(0.5 * Math.sin(t) * x * x, 0.5 * Math.cos(t), 0));
			}
		}

		const name = "particle-tear-" + index;
		let tear = BABYLON.MeshBuilder.CreateLathe("particle-tear", { shape: tearShape }, game.scene());
		tear.material = new BABYLON.StandardMaterial(name, game.scene());
		return tear;
	}
}
