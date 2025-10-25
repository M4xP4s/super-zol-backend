/**
 * Print a centered section header with a repeating fill character.
 *
 * Falls back to printing the raw title if it exceeds the configured width.
 *
 * @param title - Section title text
 * @param options - Optional formatting options
 * @param options.width - Total line width (default 60)
 * @param options.fill - Single-character fill (default '=')
 */
export function printSection(title: string, options?: { width?: number; fill?: string }): void {
  const width = options?.width && options.width > 0 ? options.width : 60;
  const fill = options?.fill?.[0] ?? '=';
  const content = ` ${title} `;
  if (content.length >= width) {
    // If title is longer than width, just print it as-is
    // to avoid truncation surprises.
    // Single line output to keep behavior predictable.
    console.log(content);
    return;
  }
  const remaining = width - content.length;
  const left = Math.floor(remaining / 2);
  const right = remaining - left;
  const line = `${fill.repeat(left)}${content}${fill.repeat(right)}`;
  console.log(line);
}

/**
 * Print a framed banner with top and bottom borders.
 *
 * If the content is longer than the width, prints the raw content without a frame.
 *
 * @param text - Content to display
 * @param options - Optional formatting options
 * @param options.width - Total line width (default 60)
 */
export function printBanner(text: string, options?: { width?: number }): void {
  const width = options?.width && options.width > 0 ? options.width : 60;
  const topBottom = '='.repeat(width);
  const content = text ?? '';
  if (content.length >= width) {
    // Fallback: print long content without framing to avoid truncation
    console.log(content);
    return;
  }
  const remaining = width - content.length;
  const left = Math.floor(remaining / 2);
  const right = remaining - left;
  const middle = `${' '.repeat(left)}${content}${' '.repeat(right)}`;
  console.log(topBottom);
  console.log(middle);
  console.log(topBottom);
}
