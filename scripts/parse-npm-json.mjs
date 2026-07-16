export function parseFinalNpmJsonArray(output) {
  const starts = [...output.matchAll(/^\[/gmu)].map((match) => match.index ?? 0);
  for (const start of starts.reverse()) {
    try {
      const value = JSON.parse(output.slice(start));
      if (Array.isArray(value)) {
        return value;
      }
    } catch {
      // npm and lifecycle tools may have written non-JSON status lines before the final payload.
    }
  }
  throw new Error("npm did not emit a JSON array");
}
