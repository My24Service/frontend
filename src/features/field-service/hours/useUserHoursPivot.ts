// Shared day-field pivot formatting for the UserHoursData list/detail pair.
//
// `dayFieldTypes` parallels `day_fields` from the API; 'duration' cells hold
// seconds and render via the caller's displayDurationFromSeconds, every other
// type renders raw. Pass the formatter the caller wants cells rendered with:
//
//   const { formatValue, formatDays } = useUserHoursPivot(displayDurationFromSeconds)
export function useUserHoursPivot(
  displayDurationFromSeconds: (seconds: number, excludeSeconds: boolean) => string,
): {
  formatValue: (val: number | string | null, index: number, dayFieldTypes: string[]) => string | number | null
  formatDays: (dayData: (number | string | null)[], dayFieldTypes: string[]) => string
} {
  const formatValue = (val: number | string | null, index: number, dayFieldTypes: string[]): string | number | null => {
    if (dayFieldTypes[index] === 'duration') {
      // The wire types a cell as `number | string | null`; a duration cell is
      // seconds. The formatter multiplies, which coerces a numeric string the
      // same way, so the cast is the API's imprecision and not a behaviour.
      return displayDurationFromSeconds(val as number, true)
    }

    return val
  }

  const formatDays = (dayData: (number | string | null)[], dayFieldTypes: string[]): string => {
    const result: (string | number | null)[] = []
    for (let i = 0; i < dayData.length; i++) {
      const day = dayData[i]
      if (day) {
        result.push(formatValue(day, i, dayFieldTypes))
      }
    }

    return result.length ? result.join(' / ') : ''
  }

  return { formatValue, formatDays }
}
