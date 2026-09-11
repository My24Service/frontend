/**
 * Placeholder satisfying generated `Authorization` header params.
 *
 * Several generated ops declare `Authorization` as a required header, but the
 * real header comes from the axios interceptor, which runs after the
 * generated request validator. A header-less call is rejected before it
 * leaves; passing this satisfies the validator and the interceptor
 * overwrites it with the real Bearer token on the wire (a headerless request
 * answers 401 — verified by stripping it in the interceptor). Hoisted here
 * from the customer slice so every slice shares one instance.
 */
export const SESSION_AUTH_HEADER = {Authorization: ''}
