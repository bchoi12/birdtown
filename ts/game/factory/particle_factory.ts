import * as BABYLON from '@babylonjs/core/Legacy/legacy'
import earcut from 'earcut'

import { game } from 'game'
import { ParticleType } from 'game/factory/api'

import { ObjectCache, ObjectCacheOnLoadFn } from 'util/object_cache'

type CreateFn = () => BABYLON.Mesh;

export namespace ParticleFactory {
	const createFns = new Map<ParticleType, CreateFn>([
		[ParticleType.CUBE, createCube],
		[ParticleType.ENERGY_CUBE, createCube],
		[ParticleType.PLANE, createPlane],
		[ParticleType.SMOKE, createSphere],
		[ParticleType.SPARK, createCube],
		[ParticleType.TEAR, createTear],
		[ParticleType.TORUS, createTorus],
		[ParticleType.TETRAHEDRON, createTetrahedron],
		[ParticleType.WATER, createSphere],
	]);

	let cache = new Map<ParticleType, BABYLON.Mesh>; 
	export function getClone(type : ParticleType) : BABYLON.Mesh {
		if (!cache.has(type)) {
			createCache(type);
		}
		return cache.get(type).clone();
	}
	export function getMesh(type : ParticleType) : BABYLON.Mesh {
		if (!createFns.has(type)) {
			console.error("Error: no create function defined for", ParticleType[type]);
			return;
		}

		return createFns.get(type)();
	}

	function createCache(type : ParticleType) : void {
		if (!createFns.has(type)) {
			console.error("Error: no create function defined for", ParticleType[type]);
			return;
		}

		cache.set(type, createFns.get(type)());
	}

	function createSphere() : BABYLON.Mesh {
		const name = "particle-sphere";
		let sphere = BABYLON.MeshBuilder.CreateSphere(name, { diameter: 1, }, game.scene());
		sphere.isVisible = false;
		sphere.material = new BABYLON.StandardMaterial(name, game.scene());
		return sphere;
	}
	function createCube() : BABYLON.Mesh {
		const name = "particle-cube";
		let cube = BABYLON.MeshBuilder.CreateBox("particle-cube", { width: 1, height: 1, depth: 1, }, game.scene());
		cube.isVisible = false;
		cube.material = new BABYLON.StandardMaterial(name, game.scene());
		return cube;
	}
	function createPlane() : BABYLON.Mesh {
		const name = "particle-plane";
		let plane = BABYLON.MeshBuilder.CreatePlane(name, {
			width: 1,
			height: 1,
		}, game.scene());
		plane.isVisible = false;
		plane.material = new BABYLON.StandardMaterial(name, game.scene());
		return plane;
	}
	function createTear() : BABYLON.Mesh {
		let tearShape = [];
		const tearSegments = 10;
		for (let i = 0; i <= tearSegments; ++i) {
			let t = i / tearSegments * Math.PI;
			let x = Math.sin(t / 2);
			tearShape.push(new BABYLON.Vector3(0.5 * Math.sin(t) * x * x, 0.5 * Math.cos(t), 0));
		}

		const name = "particle-tear";
		let tear = BABYLON.MeshBuilder.CreateLathe("particle-tear", { shape: tearShape }, game.scene());
		tear.isVisible = false;
		tear.material = new BABYLON.StandardMaterial(name, game.scene());
		return tear;
	}
	function createTorus() : BABYLON.Mesh {
		const name = "particle-torus";
		let torus = BABYLON.MeshBuilder.CreateTorus(name, {
			thickness: 0.3,
		}, game.scene());
		torus.isVisible = false;
		torus.material = new BABYLON.StandardMaterial(name, game.scene());
		return torus;
	}

	function createTetrahedron() : BABYLON.Mesh {
		const name = "particle-tetrahedron";
		let tetrahedron = BABYLON.MeshBuilder.CreatePolyhedron(name, {
			type: 0, // tetrahedron
			sizeX: 1,
			sizeY: 1,
			sizeZ: 1,
		}, game.scene());
		tetrahedron.isVisible = false;
		tetrahedron.material = new BABYLON.StandardMaterial(name, game.scene());
		return tetrahedron;
	}
}
