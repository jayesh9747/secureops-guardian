import { createHash } from 'node:crypto';

export interface FindingPackEvidenceReference {
  readonly evidence_id: string;
  readonly source_ref: string;
}

export interface FindingPackChangedFileEvidence {
  readonly repository: string;
  readonly revision: string;
  readonly file: string;
  readonly patch: string;
  readonly patch_sha256: string;
  readonly content: string;
  readonly git_blob_sha: string;
  readonly evidence_references: readonly FindingPackEvidenceReference[];
}

export interface FindingPackEvidenceContract {
  readonly schema_version: 1;
  readonly required_fields: readonly [
    'repository',
    'revision',
    'file',
    'patch',
    'patch_sha256',
    'content',
    'git_blob_sha',
    'evidence_references',
  ];
  readonly exact_git_blob_required: true;
  readonly patch_and_blob_references_required: true;
}

export const EXACT_GITHUB_FILE_EVIDENCE: FindingPackEvidenceContract = Object.freeze({
  schema_version: 1,
  required_fields: Object.freeze([
    'repository',
    'revision',
    'file',
    'patch',
    'patch_sha256',
    'content',
    'git_blob_sha',
    'evidence_references',
  ] as const),
  exact_git_blob_required: true,
  patch_and_blob_references_required: true,
});

function gitBlobSha(content: string): string {
  return createHash('sha1')
    .update(`blob ${String(Buffer.byteLength(content))}\0`)
    .update(content)
    .digest('hex');
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function patchMatchesPostimage(patch: string, content: string): boolean {
  const patchLines = patch.split('\n');
  const contentLines = content.endsWith('\n')
    ? content.slice(0, -1).split('\n')
    : content.split('\n');
  let foundHunk = false;
  for (let index = 0; index < patchLines.length; index += 1) {
    const header = patchLines[index];
    if (header === undefined || !header.startsWith('@@ ')) continue;
    const match = /^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/u.exec(header);
    if (match === null) return false;
    foundHunk = true;
    const newStart = Number(match[1]);
    const newCount = match[2] === undefined ? 1 : Number(match[2]);
    if (
      !Number.isSafeInteger(newStart) ||
      !Number.isSafeInteger(newCount) ||
      newStart < 1 ||
      newCount === 0
    ) {
      return false;
    }
    const postimage: string[] = [];
    let hunkHasAddedPostimageMutation = false;
    for (index += 1; index < patchLines.length; index += 1) {
      const line = patchLines[index];
      if (line === undefined) return false;
      if (line.startsWith('@@ ')) {
        index -= 1;
        break;
      }
      if (line.startsWith(' ') || (line.startsWith('+') && !line.startsWith('+++'))) {
        postimage.push(line.slice(1));
        if (line.startsWith('+')) hunkHasAddedPostimageMutation = true;
      } else if (line.startsWith('-') && !line.startsWith('---')) {
        // Deletion text cannot be validated from the postimage blob alone.
      } else if (!line.startsWith('\\ No newline at end of file')) {
        return false;
      }
    }
    if (!hunkHasAddedPostimageMutation || postimage.length !== newCount) return false;
    const contentPostimage = contentLines.slice(newStart - 1, newStart - 1 + newCount);
    if (
      contentPostimage.length !== newCount ||
      contentPostimage.some((line, lineIndex) => line !== postimage[lineIndex])
    ) {
      return false;
    }
  }
  return foundHunk;
}

function isSafeRepositoryRelativePath(rawPath: string): boolean {
  if (rawPath.length === 0 || rawPath.length > 1024) return false;
  let decodedPath = rawPath;
  for (let pass = 0; pass < rawPath.length; pass += 1) {
    let nextPath: string;
    try {
      nextPath = decodeURIComponent(decodedPath);
    } catch {
      return false;
    }
    if (nextPath === decodedPath) break;
    decodedPath = nextPath;
  }
  if (
    decodedPath.startsWith('/') ||
    decodedPath.includes('\\') ||
    [...decodedPath].some((character) => {
      const codePoint = character.codePointAt(0) ?? 0;
      return codePoint <= 31 || (codePoint >= 127 && codePoint <= 159);
    })
  ) {
    return false;
  }
  return decodedPath
    .split('/')
    .every((segment) => segment.length > 0 && segment !== '.' && segment !== '..');
}

export function exactFileEvidenceIsBound(file: FindingPackChangedFileEvidence): boolean {
  const patchSource = `github:${file.repository}:commit:${file.revision}:file:${file.file}:patch`;
  const blobSource = `github:${file.repository}:blob:${file.git_blob_sha}`;
  return (
    /^[A-Za-z0-9][A-Za-z0-9_.-]*\/[A-Za-z0-9][A-Za-z0-9_.-]*$/u.test(file.repository) &&
    /^[0-9a-f]{40}$/u.test(file.revision) &&
    isSafeRepositoryRelativePath(file.file) &&
    file.patch.length > 0 &&
    /^[0-9a-f]{64}$/u.test(file.patch_sha256) &&
    sha256(file.patch) === file.patch_sha256 &&
    patchMatchesPostimage(file.patch, file.content) &&
    /^[0-9a-f]{40}$/u.test(file.git_blob_sha) &&
    gitBlobSha(file.content) === file.git_blob_sha &&
    file.evidence_references.length >= 2 &&
    file.evidence_references.every(
      (reference) =>
        reference.evidence_id.startsWith('evidence:github:') &&
        (reference.source_ref === patchSource || reference.source_ref === blobSource),
    ) &&
    file.evidence_references.some((reference) => reference.source_ref === patchSource) &&
    file.evidence_references.some((reference) => reference.source_ref === blobSource)
  );
}
