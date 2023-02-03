import * as MATTER from 'matter-js'

import { defined } from 'util/common'
import { Vec } from 'util/vector'

export namespace BodyFactory {

	export const ignoreWallGroup = MATTER.Body.nextGroup(true);

	export const defaultDensity = 0.001;
	export const playerDensity = defaultDensity;
	export const heavyDensity = 10 * defaultDensity;

	export const defaultFriction = 0.1;
	export const defaultFrictionAir = 0.01;

	export const defaultOptions = {
		slop: 0,
		friction: defaultFriction,
		frictionAir: defaultFrictionAir,
		density: defaultDensity,
	};

	export function rectangle(pos : Vec, dim : Vec, options? : Object) : MATTER.Body {
		return MATTER.Bodies.rectangle(pos.x, pos.y, dim.x, dim.y, defined(options) ? {...defaultOptions, ...options} : defaultOptions);
	}

	export function circle(pos : Vec, dim : Vec, options? : Object) : MATTER.Body {
		return MATTER.Bodies.circle(pos.x, pos.y, /*radius=*/dim.x / 2, defined(options) ? {...defaultOptions, ...options} : defaultOptions);
	}
}