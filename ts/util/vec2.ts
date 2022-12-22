
import { defined } from 'util/common'

export interface Vec2 {
    x? : number;
    y? : number;
}

export namespace Vec2Math {
    export function valid(v : Vec2) : boolean {
        return defined(v.x, v.y);
    }

    export function negate(v : Vec2) : Vec2 {
        return { x: -v.x, y: -v.y };
    }

    export function lengthSq(v : Vec2) : number {
        return v.x * v.x + v.y * v.y;
    }

    export function length(v :Vec2) : number {
        return Math.sqrt(lengthSq(v));
    }

    export function normalize(v : Vec2) : Vec2 {
        const len = length(v);
        if (len === 0) {
            return {x: 0, y: 0};
        }

        return {x: v.x / len, y: v.y / len};
    }

    export function add(a : Vec2, b : Vec2) : Vec2 {
        return {x: a.x + b.x, y: a.x + b.y};
    }

    export function sub(a : Vec2, b : Vec2) : Vec2 {
        return { x: a.x - b.x, y: a.y - b.y };
    }

    export function angleRad(v : Vec2) : number {
        if (!valid(v)) {
            return 0;
        }

        if (v.x === 0) {
            return Math.PI - Math.sign(v.y) * Math.PI / 2.0
        }

        let rad = Math.atan(v.y / v.x)
        if (v.x < 0) {
            rad += Math.PI
        } else if (rad < 0) {
            rad += 2 * Math.PI
        }
        return rad
    }

    export function angleDeg(v : Vec2) : number {
        return angleRad(v) * 180 / Math.PI;
    }

    export function scale(v : Vec2, n : number) : Vec2 {
        return { x: n * v.x, y: n * v.y }
    }
}