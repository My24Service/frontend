/**
 * The Workforce Slice's door: the router imports these and nothing else. The
 * sub-folders keep their own barrels (`./leave`, `./sick-leave`,
 * `./time-registration`) so
 * each can move to its own feature unchanged when its backend app splits again.
 */
export {
  TimeRegistration,
  dateColumnLabel,
  detailRows,
  totalsFieldLabel,
  totalsTitle,
  userRows,
} from './time-registration'
export { LeaveForm, LeaveList, LeaveRequestsList, LeaveTypes } from './leave'
export {
  SickLeaveForm,
  SickLeaveList,
  UnconfirmedSickLeaveList,
  sickLeaveWrite,
} from './sick-leave'
