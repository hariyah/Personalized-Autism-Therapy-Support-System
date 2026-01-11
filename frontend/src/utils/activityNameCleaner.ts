/**
 * Removes # and numbers pattern from activity names, and cleans up trailing words
 * Examples:
 * - "Activity Name - #123" -> "Activity Name"
 * - "Activity Name #456" -> "Activity Name"
 * - "Activity Name and #123" -> "Activity Name"
 * - "Activity Name to #456" -> "Activity Name"
 * - "Activity Name from #789" -> "Activity Name"
 * - "Activity Name" -> "Activity Name" (no change)
 */
export function cleanActivityName(name: string): string {
  if (!name) return name;
  
  // Remove patterns like " - #123" or " #123" at the end
  // This regex matches: optional space/dash-space, then # followed by digits at the end
  let cleaned = name.replace(/\s*(?:-\s*)?#\d+\s*$/, '').trim();
  
  // Remove trailing incomplete words like "and", "to", "from", "with", "for", "in", "on", "at"
  // These are common words that might be left hanging after removing # numbers
  const trailingWords = /\s+(and|to|from|with|for|in|on|at|the|a|an)\s*$/i;
  cleaned = cleaned.replace(trailingWords, '').trim();
  
  // Also remove trailing dashes and spaces
  cleaned = cleaned.replace(/[\s-]+$/, '').trim();
  
  return cleaned;
}

