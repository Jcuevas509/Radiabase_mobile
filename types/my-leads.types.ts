export type MyLeadFilter = 'all' | 'scheduled' | 'follow_up';

export type MyLead = {
  readonly id: number;
  readonly fullName: string;
  readonly firstName: string | null;
  readonly lastName: string | null;
  readonly phone: string | null;
  readonly email: string | null;
  readonly address: string | null;
  readonly status: string;
  readonly notes: string | null;
  readonly appointmentAt: string | null;
  readonly createdAt: string | null;
  readonly updatedAt: string | null;
  readonly isConvertedToDeal: boolean;
  readonly officeName: string | null;
  readonly verticalName: string | null;
  readonly closerName: string | null;
};

export type MyLeadsPage = {
  readonly leads: MyLead[];
  readonly totalCount: number;
  readonly hasMore: boolean;
};
