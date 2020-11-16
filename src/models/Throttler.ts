import { Message } from "discord.js";
import { getTimeLeft } from "../utils/timeout";

export type ThrottlerScope = "global" | "user" | "member" | "guild";

export interface CommandThrottler {
    /** The scope of the throttler. */
    readonly scope: ThrottlerScope;
    /** How many time the throttler can be triggered. */
    readonly count: number;
    /** Time in seconds since the first trigger before the throttler is reset. */
    readonly duration: number;
    /**
     * Gets the number of time the throttler has been triggered.
     * @param message
     */
    getCurrent(message: Message): number;
    /**
     * Gets the number of time the throttler has been triggered.
     * @param id
     */
    getCurrent(id: string): number;
    /**
     * Gets either or not the throttler has reached the limit.
     * @param message
     */
    getThrottled(message: Message): boolean;
    /**
     * Gets either or not the throttler has reached the limit.
     * @param id
     */
    getThrottled(id: string): boolean;
    /**
     * Gets the time in seconds until the throttler is reset.
     * @param message
     */
    getCooldown(message: Message): number;
    /**
     * Gets the time in seconds until the throttler is reset.
     * @param id
     */
    getCooldown(id: string): number;
    /**
     * Resets all throttlers.
     */
    reset(): void;
    /**
     * Resets the throttler.
     * @param message
     */
    reset(message: Message): void;
    /**
     * Resets the throttler.
     * @param id
     */
    reset(id: string): void;
    /**
     * Increment the throttler's counter.
     * @param message
     * @returns Either or not the limit has been reached.
     * @example
     * ```ts
     * if (throttler.add(message)) {
     *     // Do action
     * } else {
     *     // Cannot do action
     * }
     * ```
     */
    increment(message: Message): boolean;
    /**
     * Increment the throttler's counter.
     * @param id
     * @returns Either or not the limit has been reached.
     * @example
     * ```ts
     * if (throttler.add(id)) {
     *     // Do action
     * } else {
     *     // Cannot do action
     * }
     * ```
     */
    increment(id: string): boolean;
}

export class CommandThrottler {
    /**
     * @param scope The scope of the throttler.
     * @param count How many time the throttler can be triggered.
     * @param duration Time in seconds since the first trigger before the throttler is reset.
     */
    constructor(scope: ThrottlerScope, count: number, duration: number) {
        if (scope === "global") return new Throttler(count, duration);
        else return new ScopedThrottler(scope, count, duration);
    }
}

class Throttler implements CommandThrottler {
    public readonly scope: "global" = "global";
    private _current = 0;
    private _timeout: NodeJS.Timeout | null = null;

    constructor(public readonly count: number, public readonly duration: number) {}

    getCurrent(): number {
        return this._current;
    }
    getThrottled(): boolean {
        return this._current >= this.count;
    }
    getCooldown(): number {
        return this._timeout ? Math.ceil(getTimeLeft(this._timeout)) : 0;
    }

    reset(): void {
        if (this._timeout) clearTimeout(this._timeout);
        this._timeout = null;
        this._current = 0;
    }

    increment(): boolean {
        const reachedLimit = this.getThrottled();
        this._current++;
        if (!this._timeout) this._timeout = setTimeout(() => this.reset(), this.duration * 1000);
        return reachedLimit;
    }
}

interface ThrottlerData {
    current: number;
    timeout: NodeJS.Timeout;
}

class ScopedThrottler implements CommandThrottler {
    private throttlers = new Map<string, ThrottlerData>();

    constructor(
        public readonly scope: Exclude<ThrottlerScope, "global">,
        public readonly count: number,
        public readonly duration: number,
    ) {}

    private getKey(message: Message | string) {
        if (typeof message === "string") return message;
        switch (this.scope) {
            case "user":
                return message.author.id;
            case "member":
                return message.member?.id;
            case "guild":
                return message.guild?.id;
        }
    }

    private get(message: Message | string, create = false): ThrottlerData | undefined {
        const key = this.getKey(message);
        if (!key) return undefined;

        let data = this.throttlers.get(key);
        if (!data && create) {
            data = {
                current: 0,
                timeout: setTimeout(() => this.clear(key), this.duration * 1000).unref(),
            };
            this.throttlers.set(key, data);
        }
        return data;
    }

    private clear(key: string) {
        const data = this.throttlers.get(key);
        if (data) {
            clearTimeout(data.timeout);
            this.throttlers.delete(key);
        }
    }

    getCurrent(message: Message | string): number {
        return this.get(message)?.current ?? 0;
    }

    getThrottled(message: Message | string): boolean {
        return this.getCurrent(message) >= this.count;
    }

    getCooldown(message: Message | string): number {
        const timeout = this.get(message)?.timeout;
        return timeout ? Math.ceil(getTimeLeft(timeout)) : 0;
    }

    reset(message?: Message | string): void {
        if (message) {
            const key = this.getKey(message);
            if (key) this.clear(key);
        } else {
            for (const [, data] of this.throttlers) clearTimeout(data.timeout);
            this.throttlers.clear();
        }
    }

    increment(message: Message | string): boolean {
        const data = this.get(message, true);
        if (!data) return false;
        const reachedLimit = data.current >= this.count;
        data.current++;
        return reachedLimit;
    }
}
