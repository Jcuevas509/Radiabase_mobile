import * as Location from 'expo-location';
import { ParsedHouseAddress } from 'utils/parse-house-address';

/**
 * Fills Submit Lead address from the house pin when Regrid has not saved one yet.
 */
export async function reverseGeocodeHouseAddress(
  latitude: number,
  longitude: number,
): Promise<ParsedHouseAddress | null> {
  const places = await Location.reverseGeocodeAsync({ latitude, longitude });
  const place = places[0];
  if (!place) {
    return null;
  }
  const street = [place.streetNumber, place.street].filter(Boolean).join(' ').trim();
  return {
    addressLine1: street || place.name || '',
    city: place.city || place.subregion || '',
    state: place.region || '',
    zip: place.postalCode || '',
  };
}
