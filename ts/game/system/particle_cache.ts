import * as BABYLON from '@babylonjs/core/Legacy/legacy'

import { game } from 'game'
import { System, SystemBase } from 'game/system'
import { SystemType, ParticleType } from 'game/system/api'

import { ObjectCache, ObjectCacheOnLoadFn } from 'util/object_cache'

export class ParticleCache extends SystemBase implements System {

	private static readonly _createFns = new Map<ParticleType, (index : number) => BABYLON.Mesh>([
		[ParticleType.SMOKE, ParticleCache.createSphere],
	]);

	private _cache : Map<ParticleType, ObjectCache<BABYLON.Mesh>>; 

	constructor() {
		super(SystemType.PARTICLE_CACHE);

		this._cache = new Map();
	}

	getMesh(type : ParticleType, onLoad? : ObjectCacheOnLoadFn<BABYLON.Mesh>) : BABYLON.Mesh {
		if (!this._cache.has(type)) {
			this.createCache(type);
		}

		return this._cache.get(type).borrow(onLoad);
	}

	returnMesh(type : ParticleType, mesh : BABYLON.Mesh) : void {
		if (!this._cache.has(type)) {
			this.createCache(type);
		}

		this._cache.get(type)
	}

	private createCache(type : ParticleType) : void {
		if (!ParticleCache._createFns.has(type)) {
			console.error("Error: no create function defined for", ParticleType[type]);
			return;
		}

		this._cache.set(type, new ObjectCache({
			createFn: ParticleCache._createFns.get(type),
		}));
	}

	private static createSphere(index : number) : BABYLON.Mesh {
		const name = "particle-sphere-" + index;
		let sphere = BABYLON.MeshBuilder.CreateSphere(name, { diameter: 1, }, game.scene());
		sphere.material = new BABYLON.StandardMaterial(name, game.scene());
		return sphere;
	}
	private static createCube(index : number) : BABYLON.Mesh {
		const name = "particle-cube-" + index;
		let cube =BABYLON.MeshBuilder.CreateBox("particle-cube", { width: 1, height: 1, depth: 1, }, game.scene());
		cube.material = new BABYLON.StandardMaterial(name, game.scene());
		return cube;
	}
}