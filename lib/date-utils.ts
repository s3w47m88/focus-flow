/**
 * Get a local date string in YYYY-MM-DD format without timezone conversion
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Parse a date string and set time to start of day in local timezone
 */
export function getStartOfDay(dateString: string): Date {
  // Parse the date components to avoid timezone issues
  const [year, month, day] = dateString.split('-').map(Number)
  // Create date using local timezone (month is 0-indexed)
  const date = new Date(year, month - 1, day, 0, 0, 0, 0)
  return date
}

/**
 * Check if a date string represents today in local timezone
 */
export function isToday(dateString: string): boolean {
  const todayStr = getLocalDateString()
  return dateString === todayStr
}

/**
 * Check if a date string is before today in local timezone
 */
export function isOverdue(dateString: string): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const taskDate = getStartOfDay(dateString)
  return taskDate.getTime() < today.getTime()
}

/**
 * Check if a date string is today or before in local timezone
 */
export function isTodayOrOverdue(dateString: string): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const taskDate = getStartOfDay(dateString)
  return taskDate.getTime() <= today.getTime()
}