/**
 * Placeholder satisfying generated `Authorization` header params.
 *
 * Several generated ops declare `Authorization` as a required header, but the
 * real header comes from the axios interceptor, which runs after the
 * generated request validator. A header-less call is rejected before it
 * leaves; passing this satisfies the validator and the interceptor
 * overwrites it on the wire. Hoisted here from the customer slice so every
 * slice shares one instance. Backend could drop the header param instead.
 */
export const SESSION_AUTH_HEADER = {Authorization: ''}
