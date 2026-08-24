import {
  deploymentResultSchema,
  reachabilityResultSchema,
  securityAlertResultSchema,
  serviceDependenciesResultSchema,
  type DeploymentResult,
  type ReachabilityResult,
  type SecurityAlertResult,
  type ServiceDependenciesResult,
} from '@guardian/shared';

import { getFixture } from './fixtures.js';

export function getSecurityAlert(caseId: string): SecurityAlertResult | undefined {
  const fixture = getFixture(caseId);
  if (fixture === undefined) return undefined;

  return securityAlertResultSchema.parse({
    case_id: fixture.case_id,
    synthetic: fixture.synthetic,
    alert: fixture.security_alert,
  });
}

export function getDeployment(caseId: string): DeploymentResult | undefined {
  const fixture = getFixture(caseId);
  if (fixture === undefined) return undefined;

  return deploymentResultSchema.parse({
    case_id: fixture.case_id,
    synthetic: fixture.synthetic,
    deployment: fixture.deployment,
  });
}

export function getReachabilityObservations(caseId: string): ReachabilityResult | undefined {
  const fixture = getFixture(caseId);
  if (fixture === undefined) return undefined;

  return reachabilityResultSchema.parse({
    case_id: fixture.case_id,
    synthetic: fixture.synthetic,
    observations: fixture.reachability_observations,
  });
}

export function getServiceDependencies(caseId: string): ServiceDependenciesResult | undefined {
  const fixture = getFixture(caseId);
  if (fixture === undefined) return undefined;

  return serviceDependenciesResultSchema.parse({
    case_id: fixture.case_id,
    synthetic: fixture.synthetic,
    dependencies: fixture.service_dependencies,
  });
}
