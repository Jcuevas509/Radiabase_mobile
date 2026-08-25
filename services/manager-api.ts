import type {
  Competition,
  GearItem,
  ManagerAlert,
  OfficeSummary,
  OfficeTeam,
  OnboardingRecruit,
  PendingDealApproval,
  RepPerformance,
  TeamRosterEntry,
  TeamSnapshot,
  TurfAreaSummary,
} from 'types/manager.types';
import {
  buildSampleRepPerformance,
  SAMPLE_APPROVAL_QUEUE,
  SAMPLE_COMPETITIONS,
  SAMPLE_GEAR,
  SAMPLE_MANAGER_ALERTS,
  SAMPLE_OFFICES,
  SAMPLE_OFFICE_TEAMS,
  SAMPLE_ONBOARDING,
  SAMPLE_TEAM_ROSTER,
  SAMPLE_TEAM_SNAPSHOT,
  SAMPLE_TURF_AREAS,
} from 'services/sample-team';

/** Simulated network latency so loading states behave like real fetches. */
const SAMPLE_LATENCY_MS = 350;

function sampleResponse<T>(data: T, signal?: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => resolve(data), SAMPLE_LATENCY_MS);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      // Hermes has no DOMException; a named Error matches axios' abort shape.
      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';
      reject(abortError);
    });
  });
}

// Seam: GET /team/snapshot?managerId=&period=today
export async function fetchTeamSnapshot(input: {
  readonly managerId: number;
  readonly signal?: AbortSignal;
}): Promise<TeamSnapshot> {
  return sampleResponse(SAMPLE_TEAM_SNAPSHOT, input.signal);
}

// Seam: GET /team/roster?managerId=
export async function fetchTeamRoster(input: {
  readonly managerId: number;
  readonly signal?: AbortSignal;
}): Promise<readonly TeamRosterEntry[]> {
  return sampleResponse(SAMPLE_TEAM_ROSTER, input.signal);
}

// Seam: GET /team/alerts?managerId=
export async function fetchManagerAlerts(input: {
  readonly managerId: number;
  readonly signal?: AbortSignal;
}): Promise<readonly ManagerAlert[]> {
  return sampleResponse(SAMPLE_MANAGER_ALERTS, input.signal);
}

// Seam: GET /team/reps/:repId/performance?period=week
export async function fetchRepPerformance(input: {
  readonly repId: number;
  readonly signal?: AbortSignal;
}): Promise<RepPerformance> {
  return sampleResponse(buildSampleRepPerformance(input.repId), input.signal);
}

// Seam: PUT /team/reps/:repId/goals body={weeklyGoalKnocks}
export async function saveRepWeeklyGoal(input: {
  readonly repId: number;
  readonly weeklyGoalKnocks: number;
}): Promise<void> {
  return sampleResponse(undefined);
}

// Seam: GET /deals/approvals?managerId=&status=pending
export async function fetchApprovalQueue(input: {
  readonly managerId: number;
  readonly signal?: AbortSignal;
}): Promise<readonly PendingDealApproval[]> {
  return sampleResponse(SAMPLE_APPROVAL_QUEUE, input.signal);
}

// Seam: POST /deals/approvals/:dealId/approve
export async function approveDeal(input: { readonly dealId: number }): Promise<void> {
  return sampleResponse(undefined);
}

// Seam: POST /deals/approvals/:dealId/kick-back body={reason}
export async function kickBackDeal(input: {
  readonly dealId: number;
  readonly reason: string;
}): Promise<void> {
  return sampleResponse(undefined);
}

// Seam: GET /area-management/turf-summary?managerId=
export async function fetchTurfSummary(input: {
  readonly managerId: number;
  readonly signal?: AbortSignal;
}): Promise<readonly TurfAreaSummary[]> {
  return sampleResponse(SAMPLE_TURF_AREAS, input.signal);
}

// Seam: PUT /area-management/areas/:areaId/assign body={repId}
export async function assignTurfArea(input: {
  readonly areaId: number;
  readonly repId: number;
}): Promise<void> {
  return sampleResponse(undefined);
}

// Seam: GET /offices?managerId=
export async function fetchOffices(input: {
  readonly managerId: number;
  readonly signal?: AbortSignal;
}): Promise<readonly OfficeSummary[]> {
  return sampleResponse(SAMPLE_OFFICES, input.signal);
}

// Seam: GET /teams?managerId= (teams grouped client-side by officeName)
export async function fetchOfficeTeams(input: {
  readonly managerId: number;
  readonly signal?: AbortSignal;
}): Promise<readonly OfficeTeam[]> {
  return sampleResponse(SAMPLE_OFFICE_TEAMS, input.signal);
}

// Seam: GET /gear/catalog
export async function fetchGearCatalog(input: {
  readonly signal?: AbortSignal;
}): Promise<readonly GearItem[]> {
  return sampleResponse(SAMPLE_GEAR, input.signal);
}

// Seam: GET /onboarding/recruits?managerId=
export async function fetchOnboardingRecruits(input: {
  readonly managerId: number;
  readonly signal?: AbortSignal;
}): Promise<readonly OnboardingRecruit[]> {
  return sampleResponse(SAMPLE_ONBOARDING, input.signal);
}

// Seam: PUT /onboarding/recruits/:id/advance — moves a recruit one stage
// forward; the sample layer is a no-op and the screen updates local state.
export async function advanceOnboardingRecruit(input: {
  readonly recruitId: number;
}): Promise<void> {
  return sampleResponse(undefined);
}

// Seam: GET /competitions?officeId=
export async function fetchCompetitions(input: {
  readonly managerId: number;
  readonly signal?: AbortSignal;
}): Promise<readonly Competition[]> {
  return sampleResponse(SAMPLE_COMPETITIONS, input.signal);
}
