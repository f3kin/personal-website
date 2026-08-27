/**
 * Field names shared by the subscribe form and its API route.
 *
 * Deliberately its own module with no logic in it: the client bundle needs the
 * honeypot's name to render the input, but must not pull in the server-side
 * guard, which would publish the disposable-domain list and the rest of the
 * filter rules to anyone reading the JavaScript.
 */

/** Hidden input real users never fill. A populated value means a bot. */
export const HONEYPOT_FIELD = "website"

/** Body key carrying milliseconds between form mount and submit. */
export const ELAPSED_FIELD = "elapsed_ms"
