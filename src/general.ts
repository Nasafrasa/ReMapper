const EPSILON = 1e-3;
import * as jseasingfunctions from 'js-easing-functions';
import { Animation } from './animation';
import { Wall } from './wall';
import { Difficulty } from './beatmap';
import * as three from 'three';
import { complexifyArray } from './animation';
import { Keyframe } from './animation';
import { ANIM, EASE } from './constants';
import { simplifyArray } from './animation';
import { KeyframesVec3 } from './animation';
import { activeDiff } from './beatmap';
import { Note } from './note';
import { EventInternals } from './event';

export type Vec3 = [number, number, number];
export type Vec4 = [number, number, number, number];

/**
 * Allows you to filter through an array of objects with a min and max property.
 * @param {Number} min
 * @param {Number} max
 * @param {Array} objects Array of objects to check.
 * @param {String} property What property to check for.
 * @returns {Array}
 */
export function filterObjects(objects: object[], min: number, max: number, property: string) {
    let passedObjects = [];

    objects.forEach(obj => {
        if (obj[property] + EPSILON >= min && obj[property] + EPSILON < max) passedObjects.push(obj);
    })

    return passedObjects;
}

/**
 * Sorts an array of objects by a property.
 * @param {Array} objects Array of objects to sort.
 * @param {String} property What property to sort.
 * @param {Boolean} smallestToLargest Whether to sort smallest to largest. True by default.
 */
export function sortObjects(objects: object[], property: string, smallestToLargest = true) {
    // TODO: Should we handle undefined objects? that shouldn't even be allowed
    if (objects === undefined) return;

    objects.sort((a, b) => {
        // swap vars
        if (smallestToLargest) {
            let ogA = a;
            a = b;
            b = ogA;
        }

        let aVal = a[property];
        let bVal = b[property];

        if (aVal < bVal) {
            return - 1; // a is less than b
        }
        if (aVal > bVal) {
            return 1; // a is greater than 1
        }

        return 0; // equal time
    });
}

/**
 * Gets notes between a min and max time, as a Note class.
 * @param {Number} min 
 * @param {Number} max 
 * @param {Function} forEach Lambda function for each note.
 * @returns {Array}
 */
export function notesBetween(min: number, max: number, forEach: (note: Note) => void) {
    filterObjects(activeDiff.notes, min, max, "time").forEach(x => { forEach(x) });
}

/**
 * Gets walls between a min and max time, as a Wall class.
 * @param {Number} min 
 * @param {Number} max 
 * @param {Function} forEach Lambda function for each wall.
 * @returns {Array}
 */
export function wallsBetween(min: number, max: number, forEach: (note: Wall) => void) {
    filterObjects(activeDiff.obstacles, min, max, "time").forEach(x => { forEach(x) });
}

/**
 * Gets events between a min and max time, as an Event class.
 * @param {Number} min 
 * @param {Number} max 
 * @param {Function} forEach Lambda function for each event.
 * @returns {Array}
 */
export function eventsBetween(min: number, max: number, forEach: (note: EventInternals.AbstractEvent) => void) {
    filterObjects(activeDiff.events, min, max, "time").forEach(x => { forEach(x) });
}

/**
 * Interpolates between a start and end value to get a value in between.
 * @param {Number} start 
 * @param {Number} end 
 * @param {Number} fraction
 * @param {String} easing Optional easing
 * @returns {Number}
 */
export function lerp(start: number, end: number, fraction: number, easing: EASE = undefined) {
    if (easing !== undefined) fraction = easingInterpolate(easing, fraction);
    return start + (end - start) * fraction;
}

/**
 * Interpolates between a start and end value to get a value in between. Will wrap around 0-1.
 * @param {Number} start 
 * @param {Number} end 
 * @param {Number} fraction 
 * @param {String} easing Optional easing 
 * @returns 
 */
export function lerpWrap(start: number, end: number, fraction: number, easing: EASE = undefined) {
    if (easing !== undefined) fraction = easingInterpolate(easing, fraction);
    let distance = Math.abs(end - start);

    if (distance < 0.5) return lerp(start, end, fraction);
    else {
        if (end > start) start += 1;
        else start -= 1;
        let result = lerp(start, end, fraction);
        if (result < 0) result = 1 + result;
        return result % 1;
    }
}

/**
 * Find value between 0 and 1 from a beginning, length, and a point in time between.
 * @param {Number} beginning 
 * @param {Number} length 
 * @param {Number} time 
 * @returns {Number}
 */
export function findFraction(beginning: number, length: number, time: number) {
    if (length === 0) return 0;
    return (time - beginning) / length;
}

/**
 * Get the last element in an array.
 * @param {Array} arr 
 * @returns {*}
 */
export function arrLast(arr: any[]) {
    return arr[arr.length - 1];
}

/**
 * Add either a number or another array to an array.
 * @param {Array} arr 
 * @param {*} value Can be a number or an array.
 * @returns {Array}
 */
export function arrAdd(arr: any[], value: any[] | number) {
    if (typeof value === "number") return arr.map(x => x += value);
    else return arr.map((x, i) => x += (value[i] !== undefined ? value[i] : 0));
}

/**
 * Multiply an array either by a number or another array.
 * @param {Array} arr 
 * @param {*} value Can be a number or an array.
 * @returns {Array}
 */
export function arrMul(arr: any[], value: any[] | number) {
    if (typeof value === "number") return arr.map(x => x *= value);
    else return arr.map((x, i) => x *= (value[i] !== undefined ? value[i] : 1));
}

/**
 * Divide an array either by a number or another array.
 * @param {Array} arr 
 * @param {*} value Can be a number or an array.
 * @returns {Array}
 */
export function arrDiv(arr: any[], value: any[] | number) {
    if (typeof value === "number") return arr.map(x => x /= value);
    else return arr.map((x, i) => x /= (value[i] !== undefined ? value[i] : 1));
}

/**
 * Check if 2 arrays are equal to each other.
 * @param {Array} arr1 
 * @param {Array} arr2 
 * @param {Number} lenience The maximum difference 2 numbers in an array can have before they're considered not equal.
 * @returns {Boolean}
 */
export function arrEqual(arr1: any[], arr2: any[], lenience: number = 0) {
    if (!arr1 || !arr2) return false;
    if (arr1.length !== arr2.length) return false;
    let result = true;
    arr1.forEach((x, i) => {
        if (lenience !== 0 && typeof x === "number" && typeof arr2[i] === "number") {
            let difference = x - arr2[i];
            if (Math.abs(difference) > lenience) result = false;
        }
        else if (x !== arr2[i]) result = false;
    });
    return result;
}

/**
 * Gives a random number in the given range.
 * @param {Number} start
 * @param {Number} end
 * @returns {Number}
 */
export function rand(start: number, end: number) {
    return (Math.random() * (end - start)) + start;
}

/**
 * Rounds a number to the nearest other number.
 * @param {Number} input 
 * @param {Number} number 
 * @returns {Number}
 */
export function round(input: number, number: number) {
    return Math.round(input / number) * number;
}

/**
 * Makes a number fit between a min and max value.
 * @param {Number} input
 * @param {Number} min Can be left undefined to ignore.
 * @param {Number} max Can be left undefined to ignore.
 * @returns {Number}
 */
export function clamp(input: number, min: number = undefined, max: number = undefined) {
    if (max !== undefined && input > max) input = max;
    else if (min !== undefined && input < min) input = min;
    return input;
}

/**
 * Creates a new instance of an object.
 * @param {*} obj 
 * @returns
 */
export function copy<T>(obj: T): T {
    if (obj == null || typeof obj !== "object") { return obj; }

    let newObj = Array.isArray(obj) ? [] : {};
    let keys = Object.getOwnPropertyNames(obj);

    keys.map(x => {
        let value = copy(obj[x]);
        newObj[x] = value;
    })

    Object.setPrototypeOf(newObj, (obj as any).__proto__);
    return newObj as T;
}

/**
 * Checks if an object is empty.
 * @param {Object} o 
 * @returns {Boolean}
 */
export function isEmptyObject(o: object) {
    return Object.keys(o).length === 0;
}

/**
 * Process a number through an easing.
 * @param {String} easing Name of easing.
 * @param {Number} value Progress of easing (0-1).
 * @returns {Number}
 */
export function easingInterpolate(easing: EASE, value: number) {
    if (easing === "easeLinear" || easing === undefined) return value;
    if (easing === "easeStep") return value === 1 ? 1 : 0;
    return jseasingfunctions[easing](value, 0, 1, 1);
}

/**
 * Rotate a point around 0,0,0.
 * @param {Array} rotation
 * @param {Array} point 
 * @returns {Array}
 */
export function rotatePoint(rotation: number[], point: number[]) {
    const deg2rad = Math.PI / 180;
    let mathRot: [number, number, number] = copy(rotation).map(x => x * deg2rad);
    let vector = new three.Vector3(...point).applyEuler(new three.Euler(...mathRot, "YXZ"));
    return [vector.x, vector.y, vector.z];
}

/**
 * Rotate a vector, starts downwards.
 * @param {Array} rotation
 * @param {Number} length
 * @returns {Array}
 */
export function rotateVector(rotation: number[], length: number) {
    return rotatePoint(rotation, [0, -length, 0]);
}

/**
 * Delete empty objects/arrays from an object recursively.
 * @param {Object} obj 
 */
export function jsonPrune(obj: object) {
    for (let prop in obj) {
        const type = typeof obj[prop];
        if (type === "object") {
            if (Array.isArray(obj[prop])) {
                if (obj[prop].length === 0) {
                    delete obj[prop];
                }
            } else {
                jsonPrune(obj[prop]);
                if (isEmptyObject(obj[prop])) {
                    delete obj[prop];
                }
            }
        } else if (type === "string" && obj[prop].length === 0) {
            delete obj[prop];
        }
        if (type === "undefined") delete obj[prop];
    }
}

/**
* Get a property of an object.
* @param {Object} obj 
* @param {String} prop
* @param {*} init Optional value to initialize the property if it doesn't exist yet.
*/
export function jsonGet(obj: object, prop: string) {
    const steps = prop.split('.')
    let currentObj = obj
    for (let i = 0; i < steps.length - 1; i++) {
        currentObj = currentObj[steps[i]]
        if (currentObj === undefined) return;
    }
    return currentObj[steps[steps.length - 1]];
}

/**
 * Set a property in an object, add objects if needed.
 * @param {Object} obj 
 * @param {String} prop 
 * @param {*} value
 */
export function jsonSet(obj: object, prop: string, value) {
    const steps = prop.split('.');
    let currentObj = obj;
    for (let i = 0; i < steps.length - 1; i++) {
        if (!(steps[i] in currentObj)) {
            currentObj[steps[i]] = {};
        }
        currentObj = currentObj[steps[i]];
    }
    currentObj[steps[steps.length - 1]] = value;
    //jsonPrune(obj);
}

/**
 * Check if a property in an object exists
 * @param {Object} obj 
 * @param {String} prop 
 * @returns {Boolean}
 */
export function jsonCheck(obj: object, prop: string) {
    let value = jsonGet(obj, prop);
    if (value !== undefined) return true;
    return false;
}

/**
* Remove a property of an object recursively, and delete empty objects left behind.
* @param {Object} obj 
* @param {String} prop 
*/
export function jsonRemove(obj: object, prop: string) {
    const steps = prop.split('.')
    let currentObj = obj
    for (let i = 0; i < steps.length - 1; i++) {
        currentObj = currentObj[steps[i]]
        if (currentObj === undefined) return;
    }
    delete currentObj[steps[steps.length - 1]];
    //jsonPrune(obj);
}

/**
 * Get jump related info.
 * @param {Number} NJS 
 * @param {Number} offset 
 * @param {Number} BPM 
 * @returns {Object} Returns an object; {halfDur, dist}.
 * A "jump" is the period when the object "jumps" in (indicated by spawning light on notes) to when it's deleted.
 * Jump Duration is the time in beats that the object will be jumping for.
 * This function will output half of this, so it will end when the note is supposed to be hit.
 * Jump Distance is the Z distance from when the object starts it's jump to when it's deleted.
 * This function will output the jump distance converted to noodle units.
 */
export function getJumps(NJS: number, offset: number, BPM: number) {
    const startHJD = 4;
    const maxHJD = 18;

    let num = 60 / BPM;
    let num2 = startHJD;
    while (NJS * num * num2 > maxHJD) num2 /= 2;
    num2 += offset;
    if (num2 < 1) num2 = 1;

    let jumpDur = num * num2 * 2;
    let jumpDist = NJS * jumpDur;
    jumpDist /= 0.6;

    return { halfDur: num2, dist: jumpDist };
}

/**
 * Calculate the correct position for a wall to line up with a position in the world.
 * @param {Array} pos 
 * @param {Array} rot 
 * @param {Array} scale 
 * @returns 
 */
export function worldToWall(pos: number[], rot: number[], scale: number[]) {
    let wallOffset = [0, -0.5, -0.5];
    let offset = rotatePoint(rot, scale.map((y, i) => y * wallOffset[i]));
    pos = pos.map((y, i) => y + offset[i]);

    pos[0] -= 0.5;
    pos[1] -= 0.1 / 0.6;
    pos[2] -= 0.65 / 0.6;

    return pos;
}

/**
 * Create a wall for debugging. Position, rotation, and scale are in world space and can be animations.
 * @param {Array} pos 
 * @param {Array} rot 
 * @param {Array} scale 
 * @param {Number} animStart When animation starts.
 * @param {Number} animDur How long animation lasts for.
 * @param {Number} animFreq Frequency of keyframes in animation.
 */
export function debugWall(pos: KeyframesVec3 = [0, 0, 0], rot: KeyframesVec3 = [0, 0, 0], scale: KeyframesVec3 = [1, 1, 1], animStart: number = 0, animDur: number = 0, animFreq: number = 1 / 8) {
    let wall = new Wall();
    wall.life = animDur + 69420;
    wall.lifeStart = 0;
    let wallAnim = new Animation(wall.life).wallAnimation();
    let dataAnim = new Animation().wallAnimation();
    dataAnim.position = copy(pos);
    dataAnim.rotation = copy(rot);
    dataAnim.scale = copy(scale);

    let data = {
        pos: [],
        rot: [],
        scale: []
    }

    function getDomain(arr) {
        arr = complexifyArray(arr);
        arr = arr.sort((a, b) => new Keyframe(a).time - new Keyframe(b).time);
        let min = 1;
        let max = 0;
        arr.forEach(x => {
            let time = new Keyframe(x).time;
            if (time < min) min = time;
            if (time > max) max = time;
        })
        return { min: min, max: max };
    }

    let posDomain = getDomain(pos);
    let rotDomain = getDomain(rot);
    let scaleDomain = getDomain(scale);

    let min = getDomain([[posDomain.min], [rotDomain.min], [scaleDomain.min]]).min;
    let max = getDomain([[posDomain.max], [rotDomain.max], [scaleDomain.max]]).max;

    for (let i = min; i <= max; i += animFreq / animDur) {
        let time = i * animDur + animStart;
        let objPos = dataAnim.get(ANIM.POSITION, i);
        let objRot = dataAnim.get(ANIM.ROTATION, i);
        let objScale = dataAnim.get(ANIM.SCALE, i);

        objPos = worldToWall(objPos, objRot, objScale);

        data.pos.push([...objPos, time]);
        data.rot.push([...objRot, time]);
        data.scale.push([...objScale, time])
    }

    wallAnim.definitePosition = data.pos;
    wallAnim.localRotation = data.rot;
    wallAnim.scale = data.scale;
    wallAnim.optimize();

    wall.color = [0, 0, 0, 1];
    wall.importAnimation(wallAnim);
    wall.push();
}