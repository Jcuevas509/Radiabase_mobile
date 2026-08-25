/** Domain models for the manager (admin) suite. Frontend design phase —
 * shapes mirror what the Sunnected API is expected to return so the
 * services layer can swap sample data for real responses later. */

export type RepActivityState = 'knocking' | 'idle' | 'offline';

export type TeamRosterEntry = {
  readonly repId: number;
  readonly firstName: string;
  readonly lastName: string;
  readonly roleGroup: 'Setters' | 'Closers' | 'Self Gens';
  readonly officeName: string;
  readonly activityState: RepActivityState;
  readonly knocksToday: number;
  readonly lastActivityMinutesAgo: number;
  readonly currentAreaName: string | null;
};

export type TeamSnapshot = {
  readonly knocksToday: number;
  readonly knocksChangePct: number;
  readonly appointmentsToday: number;
  readonly appointmentsChangePct: number;
  readonly dealsToday: number;
  readonly dealsChangePct: number;
  readonly repsActive: number;
  readonly repsTotal: number;
};

export type ManagerAlertKind = 'inactivity' | 'appointment' | 'aging-lead';

export type ManagerAlert = {
  readonly id: number;
  readonly kind: ManagerAlertKind;
  readonly message: string;
  readonly minutesAgo: number;
};

export type RepFunnel = {
  readonly knocks: number;
  readonly conversations: number;
  readonly appointments: number;
  readonly closes: number;
};

export type RepPerformance = {
  readonly repId: number;
  readonly firstName: string;
  readonly lastName: string;
  readonly roleGroup: TeamRosterEntry['roleGroup'];
  readonly officeName: string;
  readonly weekFunnel: RepFunnel;
  readonly teamAverageFunnel: RepFunnel;
  readonly pipelineValue: number;
  readonly weeklyGoalKnocks: number;
  readonly trend: readonly number[];
};

export type ApprovalStatus = 'pending' | 'approved' | 'kicked-back';

export type PendingDealApproval = {
  readonly id: number;
  readonly customerName: string;
  readonly address: string;
  readonly repName: string;
  readonly systemSizeKw: number;
  readonly grossPricePerWatt: number;
  readonly netPricePerWatt: number;
  readonly submittedHoursAgo: number;
  readonly status: ApprovalStatus;
};

export type TurfAreaSummary = {
  readonly id: number;
  readonly name: string;
  readonly assignedRepName: string | null;
  readonly doorsTotal: number;
  readonly doorsKnockedThisWeek: number;
  readonly lastWorkedDaysAgo: number | null;
  readonly conversionRatePct: number;
};

export type CompetitionMetric = 'Knocks' | 'Appointments' | 'Closes';

export type CompetitionStanding = {
  readonly name: string;
  /** randomuser.me path fragment, e.g. "men/45". Seam: real photo URL. */
  readonly portrait: string;
  readonly value: number;
};

export type Competition = {
  readonly id: number;
  readonly name: string;
  readonly metric: CompetitionMetric;
  readonly status: 'active' | 'ended';
  /** "All offices" or a single office name. */
  readonly officeScope: string;
  readonly endsInDays: number;
  readonly participantsCount: number;
  readonly prize: string;
  readonly leaderName: string;
  readonly topThree: readonly CompetitionStanding[];
};

export type OfficeSummary = {
  readonly id: number;
  readonly name: string;
  readonly city: string;
  readonly repsCount: number;
  readonly dealsThisMonth: number;
  readonly knocksThisWeek: number;
  readonly installsThisMonth: number;
  readonly cancelsThisMonth: number;
  readonly managerName: string;
  /** randomuser.me path fragment, e.g. "men/45". Seam: real photo URL. */
  readonly managerPortrait: string;
  /** Office anchor point for the network map and turf thumbnail. */
  readonly latitude: number;
  readonly longitude: number;
  /** Brand accent used for this office's turf outline and stats. */
  readonly accentColor: string;
};

export type TeamMember = {
  readonly name: string;
  /** randomuser.me path fragment, e.g. "men/45". Seam: real photo URL. */
  readonly portrait: string;
};

/** A small crew inside one office that pools points toward incentives. */
export type OfficeTeam = {
  readonly id: number;
  readonly name: string;
  readonly officeName: string;
  readonly emblem: string;
  readonly accentColor: string;
  readonly points: number;
  readonly pointsThisWeek: number;
  readonly goalPoints: number;
  readonly goalLabel: string;
  readonly members: readonly TeamMember[];
};

export type GearItem = {
  readonly id: number;
  readonly name: string;
  readonly category: 'Apparel' | 'Field kit' | 'Print';
  readonly priceUsd: number;
  readonly inStock: boolean;
};

export type OnboardingStage = 'Invited' | 'Docs' | 'Training' | 'Ready';

export type OnboardingRecruit = {
  readonly id: number;
  readonly firstName: string;
  readonly lastName: string;
  /** randomuser.me path fragment, e.g. "men/45". Seam: real photo URL. */
  readonly portrait: string;
  readonly officeName: string;
  readonly stage: OnboardingStage;
  readonly daysInStage: number;
};
