/** The single source of "now" for application code (D15). */
export interface Clock {
  now(): Date;
}

/** The production clock; tests inject a fixed one instead. */
export const systemClock: Clock = {
  now: () => new Date(),
};
