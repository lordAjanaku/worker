export function parseEmail(text) {
  const [header, body] = text.split("\n\n");
  return { header, body };
}
