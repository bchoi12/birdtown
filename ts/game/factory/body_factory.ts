import * as MATTER from 'matter-js'

import { CollisionCategory, CollisionGroup } from 'game/factory/api'

import { defined } from 'util/common'
import { Vec } from 'util/vector'

export namespace BodyFactory {

	export const ignoreBoundGroup = MATTER.Body.nextGroup(true);

	export const defaultDensity = 1;
	export const playerDensity = 1.5 * defaultDensity;

	export const defaultFriction = 0.1;
	export const defaultFrictionAir = 0.01;

	export const defaultOptions = {
		slop: 0.01,
		friction: defaultFriction,
		frictionAir: defaultFrictionAir,
		density: defaultDensity,
		collisionFilter: neverCollideFilter(),
	};

	export function rectangle(pos : Vec, dim : Vec, options? : Object) : MATTER.Body {
		if (!defined(options)) {
			options = {};
		}
		return MATTER.Bodies.rectangle(pos.x, pos.y, dim.x, dim.y, {...defaultOptions, ...options});
	}

	export function circle(pos : Vec, dim : Vec, options? : Object) : MATTER.Body {
		if (!defined(options)) {
			options = {};
		}
		return MATTER.Bodies.circle(pos.x, pos.y, /*radius=*/dim.x / 2, {...defaultOptions, ...options});
	}

	export function neverCollideFilter() : Object {
		return {
			group: CollisionGroup.NEVER_COLLIDE,
		};
	}

	const collisionMap = new Map<CollisionCategory, CollisionCategory[]>([
		[CollisionCategory.BOUND, [
			CollisionCategory.BOUND, CollisionCategory.HIT_BOX, CollisionCategory.OFFSET,
			CollisionCategory.PLAYER, CollisionCategory.SOLID
		]],
		[CollisionCategory.HIT_BOX, [
			CollisionCategory.BOUND, CollisionCategory.PLAYER, CollisionCategory.SOLID
		]],
		[CollisionCategory.INTERACTABLE, [
			CollisionCategory.PLAYER, CollisionCategory.SOLID,
		]],
		[CollisionCategory.OFFSET, [CollisionCategory.BOUND]],
		[CollisionCategory.PLAYER, [CollisionCategory.BOUND,
			CollisionCategory.INTERACTABLE, CollisionCategory.HIT_BOX, 
			CollisionCategory.PLAYER, CollisionCategory.SOLID,
		]],
		[CollisionCategory.SOLID, [
			CollisionCategory.BOUND, CollisionCategory.INTERACTABLE, CollisionCategory.HIT_BOX,
			CollisionCategory.PLAYER, CollisionCategory.SOLID,
		]],
	]);
	export function collisionFilter(category : CollisionCategory) : Object {
		const filter = {
			category: toBinary(category),
			mask: createMask(collisionMap.get(category)),
		}
		return filter;
	}

	export function customCollisionFilter(category : CollisionCategory, collideWith : CollisionCategory[]) : Object {
		return {
			category: toBinary(category),
			mask: createMask(collideWith),
		};
	}

	let categoryList = [];
	export function allCategories() : CollisionCategory[] {
		if (categoryList.length === 0) {
			categoryList = createAllCategoriesList();
		}

		return categoryList;
	}

	function createAllCategoriesList() : CollisionCategory[] {
		let categoryList = [];
		for (const stringCategory in CollisionCategory) {
			const category = Number(CollisionCategory[stringCategory]);
			if (Number.isNaN(category) || category <= 0) {
				continue;
			}
			categoryList.push(category);
		}
		return categoryList;
	}

	function createMask(collideWith : CollisionCategory[]) : number {
		let mask = 0;
		collideWith.forEach((category : CollisionCategory) => {
			mask = mask | toBinary(category);
		});
		return mask;
	}

	function toBinary(category : CollisionCategory) : number {
		return (0b1 << Number(category));
	}
}