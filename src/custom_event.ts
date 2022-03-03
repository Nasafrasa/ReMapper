import * as general from './general';
import * as beatmap from './beatmap';
import { activeDiff } from './beatmap';
import { AnimationInternals } from './animation';
import { Animation } from './animation';

export namespace CustomEventInternals {
    export class BaseEvent {
        json: any = {
            _time: 0,
            _type: "",
            _data: {}
        };
        animate = new Animation().abstract(this.data);

        constructor(time: number | object) {
            if (typeof time === "object") {
                Object.assign(this.json, time);
                return;
            }
            this.time = time;
        }

        /**
        * Push this event to the difficulty
        */
        push() {
            if (activeDiff.customEvents === undefined) activeDiff.customEvents = [];
            activeDiff.customEvents.push(general.copy(this));
            return this;
        }

        get time() { return this.json._time };
        get type() { return this.json._type };
        get data() { return this.json._data };

        set time(value) { this.json._time = value };
        set type(value) { this.json._type = value };
        set data(value) { this.json._data = value };
    }
}

export class CustomEvent extends CustomEventInternals.BaseEvent {
    /**
     * Event object for ease of creation.
     * @param {Object} time
     */
    constructor(time: number = 0) { super(time) }

    /**
     * Create a custom event using JSON.
     * @param {Object} json 
     * @returns {AbstractEvent}
     */
    import(json: object) { return new AbstractEvent(json) };

    /**
     * Create an event with no particular identity.
     * @returns {AbstractEvent};
     */
    abstract() { return this.import({}) };

    animateTrack(track: string, duration: number = 0, animation: object = {}, easing: string = undefined) {
        return new AnimateTrack(this.json, track, duration, animation, easing);
    }

    assignPathAnimation(track: string, duration: number = 0, animation: object = {}, easing: string = undefined) {
        return new AssignPathAnimation(this.json, track, duration, animation, easing);
    }

    assignTrackParent(childrenTracks: string[], parentTrack: string, worldPositionStays: boolean = undefined) {
        return new AssignTrackParent(this.json, childrenTracks, parentTrack, worldPositionStays);
    }

    assignPlayerToTrack(track: string) { return new AssignPlayerToTrack(this.json, track) };
    assignFogTrack(track: string) { return new AssignFogTrack(this.json, track) };
}

class AnimateTrack extends CustomEventInternals.BaseEvent {
    constructor(json: object, track: string, duration: number = 0, animation: object = {}, easing: string = undefined) {
        super(json);
        this.track = track;
        this.duration = duration;
        this.type = "AnimateTrack";
        this.setProperties(animation);
        this.animate = new Animation().abstract(this.data);

        if (easing !== undefined) this.easing = easing;
    }

    /**
     * Set the properties for animation.
     * @param data 
     */
    setProperties(data: object) {
        let oldData = general.copy(this.data);

        Object.keys(this.data).map(key => { delete this.data[key] });
        this.track = oldData._track;
        this.duration = oldData._duration;
        if (oldData._easing) this.easing = oldData._easing;

        Object.keys(data).forEach(x => {
            this.json._data[x] = data[x];
        })
    }

    /**
     * Apply an animation through the Animation class.
     * @param {Animation} animation
     */
    importAnimation(animation: AnimationInternals.BaseAnimation) {
        this.setProperties(animation.json);
        this.duration = animation.length;
        this.animate.length = animation.length;
        return this;
    }

    /**
    * Remove the subclass of the event, giving access to all properties, but can allow for invalid data.
    * @returns {AbstractEvent}
    */
    abstract() { return new CustomEvent().import(this.json) };

    get track() { return this.data._track };
    get duration() { return this.data._duration };
    get easing() { return this.data._easing };

    set track(value) { this.data._track = value };
    set duration(value) { this.data._duration = value };
    set easing(value) { this.data._easing = value };
}

class AssignPathAnimation extends CustomEventInternals.BaseEvent {
    constructor(json: object, track: string, duration: number = 0, animation: object = {}, easing: string = undefined) {
        super(json);
        this.type = "AssignPathAnimation";
        this.track = track;
        this.duration = duration;
        this.setProperties(animation);
        this.animate = new Animation().abstract(this.data);

        if (easing !== undefined) this.easing = easing;
    }

    /**
     * Set the properties for animation.
     * @param data 
     */
    setProperties(data: object) {
        let oldData = general.copy(this.data);

        Object.keys(this.data).map(key => { delete this.data[key] });
        this.track = oldData._track;
        this.duration = oldData._duration;
        if (oldData._easing) this.easing = oldData._easing;

        Object.keys(data).forEach(x => {
            this.json._data[x] = data[x];
        })
    }

    /**
     * Apply an animation through the Animation class.
     * @param {Animation} animation
     */
    importAnimation(animation: AnimationInternals.BaseAnimation) {
        this.setProperties(animation.json);
        this.duration = animation.length;
        this.animate.length = animation.length;
        return this;
    }

    /**
    * Remove the subclass of the event, giving access to all properties, but can allow for invalid data.
    * @returns {AbstractEvent}
    */
    abstract() { return new CustomEvent().import(this.json) };

    get track() { return this.data._track };
    get duration() { return this.data._duration };
    get easing() { return this.data._easing };

    set track(value) { this.data._track = value };
    set duration(value) { this.data._duration = value };
    set easing(value) { this.data._easing = value };
}

class AssignTrackParent extends CustomEventInternals.BaseEvent {
    constructor(json: object, childrenTracks: string[], parentTrack: string, worldPositionStays: boolean = undefined) {
        super(json);
        this.type = "AssignTrackParent";
        this.childrenTracks = childrenTracks;
        this.parentTrack = parentTrack;
        this.animate = new Animation().abstract(this.data);

        if (worldPositionStays !== undefined) this.worldPositionStays = worldPositionStays;
    }

    /**
    * Remove the subclass of the event, giving access to all properties, but can allow for invalid data.
    * @returns {AbstractEvent}
    */
    abstract() { return new CustomEvent().import(this.json) };

    get childrenTracks() { return this.data._childrenTracks };
    get parentTrack() { return this.data._parentTrack };
    get worldPositionStays() { return this.data._worldPositionStays };

    set childrenTracks(value) { this.data._childrenTracks = value };
    set parentTrack(value) { this.data._parentTrack = value };
    set worldPositionStays(value) { this.data._worldPositionStays = value };
}

class AssignPlayerToTrack extends CustomEventInternals.BaseEvent {
    constructor(json: object, track: string) {
        super(json);
        this.type = "AssignPlayerToTrack";
        this.track = track;
        this.animate = new Animation().abstract(this.data);
    }

    /**
    * Remove the subclass of the event, giving access to all properties, but can allow for invalid data.
    * @returns {AbstractEvent}
    */
    abstract() { return new CustomEvent().import(this.json) };

    get track() { return this.data._track };
    set track(value) { this.data._track = value };
}

class AssignFogTrack extends CustomEventInternals.BaseEvent {
    constructor(json: object, track: string) {
        super(json);
        this.type = "AssignFogTrack";
        this.track = track;
        this.animate = new Animation().abstract(this.data);
    }

    /**
    * Remove the subclass of the event, giving access to all properties, but can allow for invalid data.
    * @returns {AbstractEvent}
    */
    abstract() { return new CustomEvent().import(this.json) };

    get track() { return this.data._track };
    set track(value) { this.data._track = value };
}

class AbstractEvent extends CustomEventInternals.BaseEvent {
    constructor(json: object) {
        super(json);
        this.animate = new Animation().abstract(this.data);
    }

    /**
     * Add properties to the data.
     * @param data 
     */
    appendData(data: object) {
        Object.keys(data).forEach(x => {
            this.json._data[x] = data[x];
        })
    }

    /**
     * Apply an animation through the Animation class.
     * @param {Animation} animation
     */
    importAnimation(animation: AnimationInternals.BaseAnimation) {
        this.appendData(animation.json);
        this.duration = animation.length;
        this.animate.length = animation.length;
        return this;
    }

    get track() { return this.data._track };
    get duration() { return this.data._duration };
    get easing() { return this.data._easing };
    get childrenTracks() { return this.data._childrenTracks };
    get parentTrack() { return this.data._parentTrack };
    get worldPositionStays() { return this.data._worldPositionStays };

    set track(value) { this.data._track = value };
    set duration(value) { this.data._duration = value };
    set easing(value) { this.data._easing = value };
    set childrenTracks(value) { this.data._childrenTracks = value };
    set parentTrack(value) { this.data._parentTrack = value };
    set worldPositionStays(value) { this.data._worldPositionStays = value };
}