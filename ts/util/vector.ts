import * as BABYLON from 'babylonjs'
import * as MATTER from 'matter-js'

import { Data } from 'network/data'

import { defined } from 'util/common'
import { SeededRandom } from 'util/seeded_random'

export interface Vec {
    x? : number;
    y? : number;
    z? : number;
}

export class Vec2 implements Vec {
    public x : number;
    public y : number;

    constructor(vec : Vec) {
        this.x = defined(vec.x) ? vec.x : 0;
        this.y = defined(vec.y) ? vec.y : 0;
    }

    static zero() : Vec2 { return new Vec2({x: 0, y: 0}); }
    static one() : Vec2 { return new Vec2({x: 1, y: 1}); }
    static i() : Vec2 { return new Vec2({x: 1, y: 0}); }
    static j() : Vec2 { return new Vec2({x: 0, y: 1}); }
    static fromBabylon3(vec : BABYLON.Vector3) : Vec2 { return new Vec2({x: vec.x, y: vec.y }); }
    static fromMatter(vec : MATTER.Vector) : Vec2 { return new Vec2(vec); }
    static fromVec(vec : Vec) : Vec2 { return new Vec2(vec); }
    
    static unitFromRad(angle : number) : Vec2 {
        return new Vec2({
            x: Math.cos(angle),
            y: Math.sin(angle),
        });
    }
    static unitFromDeg(angle : number) : Vec2 {
        return Vec2.unitFromRad(angle * Math.PI / 180);
    }

    equals(other : Vec) : boolean { return Data.numberEquals(this.x, other.x) && Data.numberEquals(this.x, other.y); }

    lengthSq() : number { return this.x * this.x + this.y * this.y; }
    length() : number { return Math.sqrt(this.lengthSq()); }
    normalize() : Vec2 {
        const len = this.length();
        if (len === 0) {
            this.x = 1;
            this.y = 0;
            return this;
        }

        this.x /= len;
        this.y /= len;
        return this;
    }

    abs() : Vec2 {
        this.x = Math.abs(this.x);
        this.y = Math.abs(this.y);
        return this;
    }
    min(min : number) : Vec2 {
        this.x = Math.max(this.x, min);
        this.y = Math.max(this.y, min);
        return this;
    }

    add(vec : Vec) : Vec2 {
        if (defined(vec.x)) {
            this.x += vec.x;
        }
        if (defined(vec.y)) {
            this.y += vec.y;
        }
        return this;
    }

    mult(vec : Vec) : Vec2 {
        if (defined(vec.x)) {
            this.x *= vec.x;
        }
        if (defined(vec.y)) {
            this.y *= vec.y;
        }
        return this;
    }

    sub(vec : Vec) : Vec2 {
        if (defined(vec.x)) {
            this.x -= vec.x;
        }
        if (defined(vec.y)) {
            this.y -= vec.y;
        }
        return this;
    }

    negate() : Vec2 {
        this.x = -this.x;
        this.y = -this.y;
        return this;
    }

    scale(s : number) : Vec2 {
        this.x *= s;
        this.y *= s;
        return this;
    }

    addRandomOffset(maxOffset : Vec, rng? : SeededRandom) : Vec2 {
        this.x += ((defined(rng) ? rng.next() : Math.random()) < 0.5 ? -1 : 1) * (defined(rng) ? rng.next() : Math.random()) * maxOffset.x;
        this.y += ((defined(rng) ? rng.next() : Math.random()) < 0.5 ? -1 : 1) * (defined(rng) ? rng.next() : Math.random()) * maxOffset.y;
        return this;
    }

    angleRad() : number {
        if (this.x === 0) {
            return Math.PI - Math.sign(this.y) * Math.PI / 2.0;
        }

        let rad = Math.atan(this.y / this.x);
        if (this.x < 0) {
            rad += Math.PI;
        } else if (rad < 0) {
            rad += 2 * Math.PI;
        }
        return rad;
    }
    angleDeg() : number { return this.angleRad() * 180 / Math.PI; }

    interpolateSeparate(vec : Vec, t : Vec, interpFn : (t : number) => number) : Vec2 {
        if (defined(vec.x) && defined(t.x)) {
            this.x += (vec.x - this.x) * interpFn(t.x);
        }
        if (defined(vec.y) && defined(t.y)) {
            this.y += (vec.y - this.y) * interpFn(t.y);
        }
        return this;
    }
    lerpSeparate(vec : Vec, t : Vec) : Vec2 {
        return this.interpolateSeparate(vec, t, (t : number) => { return t; });
    }

    interpolate(vec : Vec, t : number, interpFn : (t : number) => number) : Vec2 {
        if (defined(vec.x)) {
            this.x += (vec.x - this.x) * interpFn(t);
        }
        if (defined(vec.y)) {
            this.y += (vec.y - this.y) * interpFn(t);
        }
        return this;
    }
    lerp(vec : Vec, t : number) : Vec2 {
        return this.interpolate(vec, t, (t : number) => { return t;});
    }

    copy(vec : Vec2) : Vec2 { 
        this.x = vec.x;
        this.y = vec.y;
        return this;
    }
    copyBabylon3(vec : BABYLON.Vector3) : Vec2 {
        this.x = vec.x;
        this.y = vec.y;
        return this;
    }
    copyMatter(vec : MATTER.Vector) : Vec2 {
        this.x = vec.x;
        this.y = vec.y;
        return this;
    }
    copyVec(vec : Vec) : Vec2 {
        if (defined(vec.x)) { this.x = vec.x; }
        if (defined(vec.y)) { this.y = vec.y; }
        return this;
    }

    clone() : Vec2 { return new Vec2(this); }
    toBabylon3() : BABYLON.Vector3 { return new BABYLON.Vector3(this.x, this.y, 0)}
    toMatter() : MATTER.Vector { return {x: this.x, y: this.y }; }
    toVec() : Vec { return { x: this.x, y: this.y }; }
}