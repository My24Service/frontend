import { DEFAULT_INPUT_DELAYS, inputDelays } from '@/services/input-delays'

/**
 * Put the application's real input delays back, for this test only.
 *
 * setupTests.js zeroes them before every test so specs do not sleep through
 * debounces they are not about. A spec that *is* about one - nothing asked
 * before the half-second, one ask after it - calls this first; the next test
 * starts from zero again.
 */
export function useRealInputDelays() {
  Object.assign(inputDelays, DEFAULT_INPUT_DELAYS)
}
