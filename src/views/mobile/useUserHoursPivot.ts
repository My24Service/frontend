// Shared day-field pivot formatting for the UserHoursData list/detail pair.
//
// `dayFieldTypes` parallels `day_fields` from the API; 'duration' cells hold
// seconds and render via the caller's displayDurationFromSeconds, every other
// type renders raw. Pass the component's bound formatter:
//
//   const { formatValue, formatDays } = useUserHoursPivot(
//     this.displayDurationFromSeconds.bind(this)
//   )
export function useUserHoursPivot(
  displayDurationFromSeconds: (seconds: number, excludeSeconds: boolean) => string,
): {
  formatValue: (val: number, index: number, dayFieldTypes: string[]) => string | number
  formatDays: (dayData: (number | null)[], dayFieldTypes: string[]) => string
} {
  const formatValue = (val: number, index: number, dayFieldTypes: string[]): string | number => {
    if (dayFieldTypes[index] === 'duration') {
      return displayDurationFromSeconds(val, true)
    }

    return val
  }

  const formatDays = (dayData: (number | null)[], dayFieldTypes: string[]): string => {
    const result: (string | number)[] = []
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
