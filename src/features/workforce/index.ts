/**
 * The Workforce Slice's door: the router imports these and nothing else. The
 * sub-folders keep their own barrels (`./leave`, `./sick-leave`,
 * `./time-registration`) so
 * each can move to its own feature unchanged when its backend app splits again.
 */
export { TimeRegistration } from './time-registration'
export { LeaveForm, LeaveList, LeaveRequestsList, LeaveTypes } from './leave'
export { SickLeaveForm, SickLeaveList, UnconfirmedSickLeaveList } from './sick-leave'
export { sickLeaveWrite } from './sick-leave'
export { dateColumnLabel } from './time-registration'
export { detailRows } from './time-registration'
export { totalsFieldLabel } from './time-registration'
export { totalsTitle } from './time-registration'
export { userRows } from './time-registration'
