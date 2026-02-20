import { managementApiRequest, getProjectRef } from '../../../src/client.ts';
import { assertAllowed } from '../../../src/permissions.ts';
import type { AdvisoryNotice } from '../../../src/types.ts';

type AdvisorType = 'security' | 'performance';

interface GetAdvisorsOptions {
  type: AdvisorType;
}

interface RawAdvisory {
  name: string;
  title: string;
  description: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
  remediation?: string;
  remediation_url?: string;
  category?: string;
}

interface AdvisorsResponse {
  [key: string]: RawAdvisory[];
}

/**
 * Gets advisory notices for the Supabase project.
 * Checks for security vulnerabilities or performance improvements.
 *
 * It's recommended to run this regularly, especially after making DDL changes
 * to the database since it will catch things like missing RLS policies.
 */
export async function getAdvisors(options: GetAdvisorsOptions): Promise<AdvisoryNotice[]> {
  const { type } = options;

  // Check permissions
  await assertAllowed('advisors', 'read');

  const projectRef = getProjectRef();

  // Get advisors from Management API
  // The endpoint is /advisors/security or /advisors/performance
  const response = await managementApiRequest<AdvisorsResponse>(
    `/projects/${projectRef}/advisors/${type}`
  );

  // Flatten all advisories from the response (the endpoint already filters by type)
  const allAdvisories: RawAdvisory[] = Object.values(response).flat();

  // Map severity levels
  const severityMap: Record<string, AdvisoryNotice['severity']> = {
    'INFO': 'low',
    'WARN': 'medium',
    'ERROR': 'high',
    'CRITICAL': 'critical',
  };

  // Map to our format
  return allAdvisories.map(advisory => ({
    type,
    title: advisory.title || advisory.name,
    description: advisory.description,
    severity: severityMap[advisory.level] || 'medium',
    remediationUrl: advisory.remediation_url,
  }));
}
