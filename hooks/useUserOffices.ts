import { useEffect, useState } from 'react';
import { fetchUserOffices } from 'services/offices-api';
import { SubmitLeadOffice } from 'types/submit-lead.types';

/**
 * Loads offices the setter can submit a lead to.
 */
export function useUserOffices(isEnabled: boolean): {
  readonly offices: SubmitLeadOffice[];
  readonly isLoading: boolean;
} {
  const [offices, setOffices] = useState<SubmitLeadOffice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    if (!isEnabled) {
      return;
    }
    let isActive = true;
    setIsLoading(true);
    fetchUserOffices()
      .then((nextOffices) => {
        if (isActive) {
          setOffices(nextOffices);
        }
      })
      .catch(() => {
        if (isActive) {
          setOffices([]);
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });
    return () => {
      isActive = false;
    };
  }, [isEnabled]);
  return { offices, isLoading };
}
