// Shared day-field pivot formatting for the UserHoursData list/detail pair.
//
// `dayFieldTypes` parallels `day_fields` from the API; 'duration' cells hold
// seconds and render via the caller's displayDurationFromSeconds, every other
// type renders raw. Pass the component's bound formatter:
//
//   const { formatValue, formatDays } = useUserHoursPivot(
//     this.displayDurationFromSeconds.bind(this)
//   )
export function useUserHoursPivot(displayDurationFromSeconds) {
  const formatValue = (val, index, dayFieldTypes) => {
    if (dayFieldTypes[index] === 'duration') {
      return displayDurationFromSeconds(val, true)
    }

    return val
  }

  const formatDays = (dayData, dayFieldTypes) => {
    const result = []
    for (let i = 0; i < dayData.length; i++) {
      if (dayData[i]) {
        result.push(formatValue(dayData[i], i, dayFieldTypes))
      }
    }

    return result.length ? result.join(' / ') : ''
  }

  return { formatValue, formatDays }
}
