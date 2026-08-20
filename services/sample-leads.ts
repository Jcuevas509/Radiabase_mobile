import { MY_LEADS_PAGE_SIZE } from 'services/leads-api';
import type { MyLead, MyLeadFilter, MyLeadsPage } from 'types/my-leads.types';

const FIRST_NAMES = [
  'Maria', 'James', 'Ashley', 'Robert', 'Karen', 'Luis', 'Brittany', 'Frank',
  'Denise', 'Hector', 'Paula', 'Greg', 'Wanda', 'Omar', 'Cheryl', 'Victor',
  'Tina', 'Doug', 'Rosa', 'Neil', 'Gloria', 'Pete', 'Iris', 'Sam', 'Faye',
  'Carl', 'Nadia', 'Bruce', 'Elena', 'Todd', 'Vera', 'Hank', 'Lena', 'Ray',
  'Joan', 'Walt', 'Mona', 'Earl', 'Sadie', 'Gus', 'Pearl', 'Ned', 'Opal',
];

const LAST_NAMES = [
  'Lopez', 'Turner', 'Nguyen', 'Fields', 'Marsh', 'Ortega', 'Kane', 'Doyle',
  'Barrett', 'Sims', 'Vaughn', 'Holt', 'Pruitt', 'Lang', 'Mercado', 'Boone',
  'Frost', 'Gaines', 'Herrera', 'Knox', 'Larsen', 'Mott', 'Nolan', 'Pike',
  'Quimby', 'Rhodes', 'Stroud', 'Tate', 'Underhill', 'Vance', 'Whitley',
  'Yates', 'Zamora', 'Ashford', 'Bishop', 'Crane', 'Dalton', 'Eastman',
  'Foley', 'Granger', 'Hobbs', 'Ingram', 'Jarvis',
];

const STREETS = [
  'Diana Dr', 'Maple Ave', 'Oakwood Ct', 'Sunset Blvd', 'Cedar Ln',
  'Willow Way', 'Ridgeview Dr', 'Pecan St', 'Bluebonnet Trl', 'Meadow Rd',
];

const STATUS_SEQUENCE = [
  'new', 'new', 'follow_up', 'assigned', 'rescheduled', 'new', 'unresponsive',
  'sold', 'not_interested', 'follow_up', 'unqualified', 'new', 'canceled',
  'sold', 'assigned',
];

const HOUR_MS = 3_600_000;

function buildSampleLead(index: number, nowMs: number): MyLead {
  const firstName = FIRST_NAMES[index % FIRST_NAMES.length];
  const lastName = LAST_NAMES[index % LAST_NAMES.length];
  const status = STATUS_SEQUENCE[index % STATUS_SEQUENCE.length];
  // Every third lead has an appointment; alternate future (reminder button
  // visible) and past.
  const appointmentAt = index % 3 === 0
    ? new Date(nowMs + (index % 6 === 0 ? (index + 2) * HOUR_MS : -(index + 4) * HOUR_MS)).toISOString()
    : null;
  const createdAt = new Date(nowMs - index * 7 * HOUR_MS).toISOString();
  return {
    id: 9000 + index,
    fullName: `${firstName} ${lastName}`,
    firstName,
    lastName,
    phone: `214555${String(1000 + index).slice(-4)}`,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
    address: `${100 + index * 7} ${STREETS[index % STREETS.length]}, Garland, TX 75043`,
    status,
    notes: index % 5 === 0 ? 'Asked about panel warranty and financing.' : null,
    appointmentAt,
    createdAt,
    updatedAt: createdAt,
    isConvertedToDeal: status === 'sold' && index % 2 === 0,
    officeName: 'Suntrappers',
    verticalName: 'Solar',
    closerName: index % 4 === 0 ? 'Jose Cuevas' : null,
  };
}

/**
 * Demo stand-in for fetchMyLeads while the UI is being designed: ~40 varied
 * leads honoring the same search, filter, and pagination contract. Delete
 * this file (and its call site flag) once real data is wired everywhere.
 */
export async function fetchSampleMyLeads({
  page = 1,
  search,
  filter = 'all',
}: {
  readonly salesRepId: number;
  readonly page?: number;
  readonly search?: string;
  readonly filter?: MyLeadFilter;
  readonly signal?: AbortSignal;
}): Promise<MyLeadsPage> {
  const nowMs = Date.now();
  const all = Array.from({ length: 43 }, (_, index) => buildSampleLead(index, nowMs));
  const query = (search ?? '').trim().toLowerCase();
  const filtered = all.filter((lead) => {
    if (filter === 'scheduled' && lead.appointmentAt === null) {
      return false;
    }
    if (filter === 'follow_up' && lead.status !== 'follow_up' && lead.status !== 'rescheduled') {
      return false;
    }
    if (!query) {
      return true;
    }
    return [lead.fullName, lead.address ?? '', lead.phone ?? '', lead.email ?? '']
      .some((value) => value.toLowerCase().includes(query));
  });
  const start = (page - 1) * MY_LEADS_PAGE_SIZE;
  const leads = filtered.slice(start, start + MY_LEADS_PAGE_SIZE);
  return {
    leads,
    totalCount: filtered.length,
    hasMore: start + leads.length < filtered.length,
  };
}
