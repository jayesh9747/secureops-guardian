import { createHash } from 'node:crypto';

import { PHASE_THREE_PROPOSAL_HASH } from '@guardian/github-write';
import {
  FINDING_PACK_REGISTRY,
  type FindingPackChangedFileEvidence,
} from '@guardian/investigation';

const REPOSITORY = 'jayesh9747/guardian-demo-privileged-api';
const FILE = 'k8s/api-deployment.yaml';
const SUSPECT_REVISION = '2c7bdb3e07714e08d9504b3504587fbf18847f29';
const SUSPECT_BLOB_SHA = 'b1a60bb96fad7f93bc95536d08381e5629a6a7bd';
const BENIGN_REVISION = 'd2ee0cdc4e27cc8af671f4c0de15081d1c996e36';
const BENIGN_BLOB_SHA = '3e8b0f62ef1ba0553b1b4b310444f9a207b9fc9a';
const SUSPECT_PATCH = `@@ -14,19 +14,20 @@ spec:
         app: catalog-api
     spec:
       securityContext:
-        runAsNonRoot: true
-        runAsUser: 10001
+        runAsNonRoot: false
+        runAsUser: 0
         seccompProfile:
           type: RuntimeDefault
       containers:
         - name: catalog-api
           image: ghcr.io/example/catalog-api:1.4.0
           securityContext:
-            allowPrivilegeEscalation: false
+            allowPrivilegeEscalation: true
+            privileged: true
             readOnlyRootFilesystem: true
             capabilities:
-              drop:
-                - ALL
+              add:
+                - SYS_ADMIN
           ports:
             - name: http
               containerPort: 8080`;
const BENIGN_PATCH = `@@ -0,0 +1,32 @@
+apiVersion: apps/v1
+kind: Deployment
+metadata:
+  name: catalog-api
+  namespace: commerce
+spec:
+  replicas: 2
+  selector:
+    matchLabels:
+      app: catalog-api
+  template:
+    metadata:
+      labels:
+        app: catalog-api
+    spec:
+      securityContext:
+        runAsNonRoot: true
+        runAsUser: 10001
+        seccompProfile:
+          type: RuntimeDefault
+      containers:
+        - name: catalog-api
+          image: ghcr.io/example/catalog-api:1.4.0
+          securityContext:
+            allowPrivilegeEscalation: false
+            readOnlyRootFilesystem: true
+            capabilities:
+              drop:
+                - ALL
+          ports:
+            - name: http
+              containerPort: 8080`;

function repositoryEvidence(options: {
  revision: string;
  gitBlobSha: string;
  content: string;
  role: 'suspect' | 'benign';
}): FindingPackChangedFileEvidence {
  return {
    repository: REPOSITORY,
    revision: options.revision,
    file: FILE,
    patch: options.role === 'suspect' ? SUSPECT_PATCH : BENIGN_PATCH,
    patch_sha256: createHash('sha256')
      .update(options.role === 'suspect' ? SUSPECT_PATCH : BENIGN_PATCH)
      .digest('hex'),
    content: options.content,
    git_blob_sha: options.gitBlobSha,
    evidence_references: [
      {
        evidence_id: `evidence:github:diff:privileged-api:${options.role}`,
        source_ref: `github:${REPOSITORY}:commit:${options.revision}:file:${FILE}:patch`,
      },
      {
        evidence_id: `evidence:github:manifest:privileged-api:${options.role}`,
        source_ref: `github:${REPOSITORY}:blob:${options.gitBlobSha}`,
      },
    ],
  };
}

function summarizedAnalysis(evidence: FindingPackChangedFileEvidence) {
  const result = FINDING_PACK_REGISTRY.analyze({
    requested_capability: 'ANALYSIS_ONLY',
    changed_files: [evidence],
  });
  if (result.outcome !== 'ANALYZED') {
    throw new Error(
      `Phase 10 evidence fixture was inconclusive: ${result.missing_or_unsupported_requirements.join('; ')}`,
    );
  }
  return {
    repository: result.repository,
    revision: result.revision,
    file: result.file,
    git_blob_sha: evidence.git_blob_sha,
    pack_id: result.pack.pack_id,
    pack_version: result.pack.pack_version,
    finding_count: result.findings.length,
    rule_ids: result.findings.map((finding) => finding.rule_id),
    json_paths: result.findings.map((finding) => finding.json_path),
    runtime_unknowns: result.claims.unknown,
  };
}

export function buildPhaseTenEvidenceMatrix(input: { suspect: string; benign: string }) {
  const suspectEvidence = repositoryEvidence({
    revision: SUSPECT_REVISION,
    gitBlobSha: SUSPECT_BLOB_SHA,
    content: input.suspect,
    role: 'suspect',
  });
  const benignEvidence = repositoryEvidence({
    revision: BENIGN_REVISION,
    gitBlobSha: BENIGN_BLOB_SHA,
    content: input.benign,
    role: 'benign',
  });
  const capabilityStop = FINDING_PACK_REGISTRY.analyze({
    requested_capability: 'OPEN_PR_ELIGIBLE',
    changed_files: [suspectEvidence],
  });
  if (capabilityStop.outcome !== 'INCONCLUSIVE') {
    throw new Error('Workload pack unexpectedly entered a higher-capability route.');
  }

  return {
    live_repository: summarizedAnalysis(suspectEvidence),
    benign_parent: summarizedAnalysis(benignEvidence),
    workload_capability_stop: {
      outcome: capabilityStop.outcome,
      verifier: capabilityStop.routes.verifier,
      proposal: capabilityStop.routes.proposal,
      approval: capabilityStop.routes.approval,
      github_writes: capabilityStop.routes.github_writes,
    },
    egress_proposal_hash: PHASE_THREE_PROPOSAL_HASH,
  };
}
