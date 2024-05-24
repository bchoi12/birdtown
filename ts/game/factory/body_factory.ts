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

	let collisionMap = new Map<CollisionCategory, CollisionCategory[]>();
	export function collisionFilter(category : CollisionCategory) : Object {
		if (collisionMap.size === 0) {
			addCollisionPair(CollisionCategory.BOUND, CollisionCategory.BOUND);
			addCollisionPair(CollisionCategory.BOUND, CollisionCategory.HIT_BOX);
			addCollisionPair(CollisionCategory.BOUND, CollisionCategory.OFFSET);
			addCollisionPair(CollisionCategory.BOUND, CollisionCategory.PLAYER);
			addCollisionPair(CollisionCategory.BOUND, CollisionCategory.SOLID);

			addCollisionPair(CollisionCategory.HIT_BOX, CollisionCategory.PLAYER);
			addCollisionPair(CollisionCategory.HIT_BOX, CollisionCategory.SOLID);

			addCollisionPair(CollisionCategory.INTERACTABLE, CollisionCategory.PLAYER);
			addCollisionPair(CollisionCategory.INTERACTABLE, CollisionCategory.SOLID);

			addCollisionPair(CollisionCategory.PLAYER, CollisionCategory.PLAYER);
			addCollisionPair(CollisionCategory.PLAYER, CollisionCategory.SOLID);

			addCollisionPair(CollisionCategory.SOLID, CollisionCategory.SOLID);
		}

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

	function addCollisionPair(first : CollisionCategory, second : CollisionCategory) : void {
		if (!collisionMap.has(first)) {
			collisionMap.set(first, new Array());
		}
		if (!collisionMap.has(second)) {
			collisionMap.set(second, new Array());
		}

		collisionMap.get(first).push(second);

		if (first !== second) {
			collisionMap.get(second).push(first);
		}
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