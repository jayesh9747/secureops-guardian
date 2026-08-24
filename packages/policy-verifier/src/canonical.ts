import { parseAllDocuments, stringify } from 'yaml';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function canonicalValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalValue);
  if (!isRecord(value)) return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, canonicalValue(value[key])]),
  );
}

export function canonicalJson(value: unknown): string {
  return `${JSON.stringify(canonicalValue(value))}\n`;
}

export function canonicalizeYaml(yaml: string): string {
  const documents = parseAllDocuments(yaml, { prettyErrors: false });
  if (documents.length !== 1 || documents[0] === undefined || documents[0].errors.length > 0) {
    throw new Error('Cannot canonicalize invalid or multi-document YAML.');
  }
  const value = documents[0].toJS() as unknown;
  if (!isRecord(value)) throw new Error('Cannot canonicalize a non-object YAML document.');
  return stringify(canonicalValue(value), { lineWidth: 0 });
}

function textLines(text: string): string[] {
  const normalized = text.replaceAll('\r\n', '\n');
  return normalized.endsWith('\n') ? normalized.slice(0, -1).split('\n') : normalized.split('\n');
}

function diffLines(before: string[], after: string[]): string[] {
  const lengths = Array.from({ length: before.length + 1 }, () =>
    Array<number>(after.length + 1).fill(0),
  );
  for (let beforeIndex = before.length - 1; beforeIndex >= 0; beforeIndex -= 1) {
    for (let afterIndex = after.length - 1; afterIndex >= 0; afterIndex -= 1) {
      lengths[beforeIndex]![afterIndex] =
        before[beforeIndex] === after[afterIndex]
          ? 1 + lengths[beforeIndex + 1]![afterIndex + 1]!
          : Math.max(
              lengths[beforeIndex + 1]![afterIndex]!,
              lengths[beforeIndex]![afterIndex + 1]!,
            );
    }
  }

  const result: string[] = [];
  let beforeIndex = 0;
  let afterIndex = 0;
  while (beforeIndex < before.length || afterIndex < after.length) {
    if (
      beforeIndex < before.length &&
      afterIndex < after.length &&
      before[beforeIndex] === after[afterIndex]
    ) {
      result.push(` ${before[beforeIndex] ?? ''}`);
      beforeIndex += 1;
      afterIndex += 1;
    } else if (
      afterIndex < after.length &&
      (beforeIndex === before.length ||
        lengths[beforeIndex]![afterIndex + 1]! >= lengths[beforeIndex + 1]![afterIndex]!)
    ) {
      result.push(`+${after[afterIndex] ?? ''}`);
      afterIndex += 1;
    } else {
      result.push(`-${before[beforeIndex] ?? ''}`);
      beforeIndex += 1;
    }
  }
  return result;
}

export function canonicalUnifiedDiff(before: string, after: string, path: string): string {
  const beforeLines = textLines(before);
  const afterLines = textLines(after);
  const body = diffLines(beforeLines, afterLines);
  return [
    `--- a/${path}`,
    `+++ b/${path}`,
    `@@ -1,${beforeLines.length} +1,${afterLines.length} @@`,
    ...body,
    '',
  ].join('\n');
}
