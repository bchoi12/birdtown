import * as BABYLON from '@babylonjs/core/Legacy/legacy'
import * as MATTER from 'matter-js'

import { SeededRandom } from 'util/seeded_random'

export interface Vec {
    x? : number;
    y? : number;
    z? : number;
}

export class Vec2 implements Vec {

    public static readonly defaultEpsilon = 1e-3;

    public x : number;
    public y : number;

    constructor(vec : Vec) {
        this.x = vec.x ? vec.x : 0;
        this.y = vec.y ? vec.y : 0;
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

    static approxEquals(a : Vec, b : Vec, epsilon : number) : boolean {
        if (Math.abs(a.x - b.x) >= epsilon || Math.abs(a.y - b.y) >= epsilon) {
            return false;
        }
        if (Vec2.isZero(a) !== Vec2.isZero(b)) {
            return false;
        }
        return true;
    }
    static equals(a : Vec, b : Vec) : boolean { return Vec2.approxEquals(a, b, Vec2.defaultEpsilon); }

    approxEquals(other : Vec, epsilon : number) : boolean { return Vec2.approxEquals(this, other, epsilon); }
    equals(other : Vec) : boolean { return Vec2.equals(this, other); }

    static isZero(vec : Vec) : boolean { return vec.x === 0 && vec.y === 0; }
    static approxZero(vec : Vec, epsilon : number) : boolean { return Math.abs(vec.x) < epsilon && Math.abs(vec.y) < epsilon; }
    isZero() : boolean { return Vec2.isZero(this); }
    roundToEpsilon(epsilon : number) : Vec2 {
        this.x = Math.round(this.x / epsilon) * epsilon;
        this.y = Math.round(this.y / epsilon) * epsilon;
        return this;
    }
    approxZero(epsilon : number) : boolean { return Vec2.approxZero(this, epsilon); }
    zeroEpsilon(epsilon : number) : Vec2 {
        if (Math.abs(this.x) < epsilon) { this.x = 0; }
        if (Math.abs(this.y) < epsilon) { this.y = 0; }
        return this;
    }

    distSq(other : Vec) : number {
        const xDist = this.x - other.x;
        const yDist = this.y - other.y;
        return xDist * xDist + yDist * yDist;
    }
    dist(other : Vec) : number { return Math.sqrt(this.distSq(other)); }
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
    square() : Vec2 {
        this.x *= this.x;
        this.y *= this.y;
        return this;
    }
    min(other : Vec) : Vec2 {
        if (other.hasOwnProperty("x") && other.x < this.x) {
            this.x = other.x;
        }
        if (other.hasOwnProperty("y") && other.y < this.y) {
            this.y = other.y;
        }
        return this;
    }
    max(other : Vec) : Vec2 {
        if (other.hasOwnProperty("x") && other.x > this.x) {
            this.x = other.x;
        }
        if (other.hasOwnProperty("y") && other.y > this.y) {
            this.y = other.y;
        }
        return this;
    }
    clamp(min : number, max : number) : Vec2 {
        this.x = Math.max(min, Math.min(max, this.x));
        this.y = Math.max(min, Math.min(max, this.y));
        return this;
    }

    add(vec : Vec) : Vec2 {
        if (vec.x) {
            this.x += vec.x;
        }
        if (vec.y) {
            this.y += vec.y;
        }
        return this;
    }

    mult(vec : Vec) : Vec2 {
        if (vec.hasOwnProperty("x")) {
            this.x *= vec.x;
        }
        if (vec.hasOwnProperty("y")) {
            this.y *= vec.y;
        }
        return this;
    }

    sub(vec : Vec) : Vec2 {
        if (vec.x) {
            this.x -= vec.x;
        }
        if (vec.y) {
            this.y -= vec.y;
        }
        return this;
    }
    subScalar(scalar : number) : Vec2 {
        this.x -= scalar;
        this.y -= scalar;
        return this;
    }

    dot(vec : Vec) : number { return this.x * vec.x + this.y * vec.y; }

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
        this.x += ((rng ? rng.next() : Math.random()) < 0.5 ? -1 : 1) * (rng ? rng.next() : Math.random()) * maxOffset.x;
        this.y += ((rng ? rng.next() : Math.random()) < 0.5 ? -1 : 1) * (rng ? rng.next() : Math.random()) * maxOffset.y;
        return this;
    }

    setAngleRad(rad : number) : Vec2 {
        const len = this.length();
        this.x = Math.cos(rad) * len;
        this.y = Math.sin(rad) * len;
        return this;
    }
    setAngleDeg(deg : number) : Vec2 {
        return this.setAngleRad(deg * Math.PI / 180)
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

    interpolate(vec : Vec, t : number, interpFn : (t : number) => number) : Vec2 {
        if (vec.hasOwnProperty("x")) {
            this.x += (vec.x - this.x) * interpFn(t);
        }
        if (vec.hasOwnProperty("y")) {
            this.y += (vec.y - this.y) * interpFn(t);
        }
        return this;
    }
    interpolateClone(vec : Vec, t : number, interpFn : (t : number) => number) : Vec2 {
        return this.clone().interpolate(vec, t, interpFn);
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
        if (vec.hasOwnProperty("x")) { this.x = vec.x; }
        if (vec.hasOwnProperty("y")) { this.y = vec.y; }
        return this;
    }

    clone() : Vec2 { return new Vec2(this); }
    toVec3() : Vec3 { return new Vec3({x: this.x, y: this.y, z: 0 }); }
    toBabylon3() : BABYLON.Vector3 { return new BABYLON.Vector3(this.x, this.y, 0)}
    toMatter() : MATTER.Vector { return {x: this.x, y: this.y }; }
    toVec() : Vec { return { x: this.x, y: this.y }; }

    toString() : string { return "{ x: " + this.x + ", y: " + this.y + " }"; }
}

// Use with caution, most methods are unimplemented.
export class Vec3 extends Vec2 implements Vec {

    public z : number;

    constructor(vec : Vec) {
        super(vec);

        this.z = vec.z ? vec.z : 0;
    }

    static override zero() : Vec3 { return new Vec3({x: 0, y: 0, z: 0}); }
    static override one() : Vec3 { return new Vec3({x: 1, y: 1, z: 1}); }
    static override fromVec(vec : Vec) : Vec3 { return new Vec3(vec); }
    static override fromBabylon3(vec : BABYLON.Vector3) : Vec3 { return new Vec3({x: vec.x, y: vec.y, z: vec.z }); }

    override distSq(other : Vec) : number {
        const zDist = this.z - other.z;
        return super.distSq(other) + zDist;
    }
    override dist(other : Vec) : number { return Math.sqrt(this.distSq(other)); }
    override lengthSq() : number { return this.x * this.x + this.y * this.y + this.z * this.z; }
    override length() : number { return Math.sqrt(this.lengthSq()); }
    override normalize() : Vec3 {
        const len = this.length();
        if (len === 0) {
            this.x = 1;
            this.y = 0;
            this.z = 0;
            return this;
        }

        this.x /= len;
        this.y /= len;
        this.z /= len;

        return this;
    }

    override add(vec : Vec) : Vec3 {
        super.add(vec);
        if (vec.z) {
            this.z += vec.z;
        }
        return this;
    }
    override sub(vec : Vec) : Vec3 {
        super.sub(vec);
        if (vec.z) {
            this.z -= vec.z;
        }
        return this;
    }
    override mult(vec : Vec) : Vec3 {
        super.mult(vec);
        if (vec.hasOwnProperty("z")) {
            this.z *= vec.z;
        }
        return this;
    }

    override interpolate(vec : Vec, t : number, interpFn : (t : number) => number) : Vec3 {
        super.interpolate(vec, t, interpFn);
        if (vec.hasOwnProperty("z")) {
            this.z += (vec.z - this.z) * interpFn(t);
        }
        return this;
    }
    override interpolateClone(vec : Vec, t : number, interpFn : (t : number) => number) : Vec3 {
        return this.clone().interpolate(vec, t, interpFn);
    }
    override lerp(vec : Vec, t : number) : Vec3 {
        return this.interpolate(vec, t, (t : number) => { return t;});
    }

    override copy(vec : Vec3) : Vec3 { 
        this.x = vec.x;
        this.y = vec.y;
        this.z = vec.z;
        return this;
    }
    override copyVec(vec : Vec) : Vec3 {
        super.copyVec(vec);
        if (vec.hasOwnProperty("z")) { this.z = vec.z; }
        return this;
    }

    override clone() : Vec3 { return new Vec3(this); }
    override toVec() : Vec { return {x : this.x, y: this.y, z: this.z }; }
}
