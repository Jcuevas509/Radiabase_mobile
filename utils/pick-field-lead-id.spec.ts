import { pickFieldLeadId } from './pick-field-lead-id';

describe('pickFieldLeadId', () => {
  it('returns the numeric id from a lead payload', () => {
    const actualId = pickFieldLeadId({ id: 42, files: [] });

    expect(actualId).toBe(42);
  });

  it('throws when the payload has no lead id', () => {
    expect(() => pickFieldLeadId({ files: [] })).toThrow('The API did not return a lead id.');
  });
});
