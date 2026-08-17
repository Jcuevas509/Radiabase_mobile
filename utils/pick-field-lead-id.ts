/**
 * Reads the numeric lead id from a POST /leads response body.
 */
export function pickFieldLeadId(payload: unknown): number {
  if (payload && typeof payload === 'object' && 'id' in payload) {
    const leadId = (payload as { id: unknown }).id;
    if (typeof leadId === 'number') {
      return leadId;
    }
  }
  throw new Error('The API did not return a lead id.');
}
