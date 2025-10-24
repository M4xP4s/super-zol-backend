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
