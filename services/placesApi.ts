import { GOOGLE_ANDROID_CERT_SHA1, GOOGLE_MAPS_API_KEY } from '@env';

export type PlaceSuggestion = {
  placeId: string;
  primaryText: string;
  secondaryText?: string;
};

export type Place = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  rating?: number;
  userRatingsTotal?: number;
  photoName?: string;
};

const placesApiUrl = 'https://places.googleapis.com/v1';

const normalizePlace = (place: any): Place => ({
  id: place.id,
  name: place.displayName?.text || 'Unnamed restaurant',
  latitude: place.location?.latitude,
  longitude: place.location?.longitude,
  address: place.formattedAddress || '',
  rating: place.rating,
  userRatingsTotal: place.userRatingCount,
  photoName: place.photos?.[0]?.name,
});

const request = async <T>(
  path: string,
  options: RequestInit = {},
): Promise<T> => {
  const response = await fetch(`${placesApiUrl}${path}`, {
    ...options,
    headers: {
      'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
      'X-Android-Package': 'com.infohub',
      'X-Android-Cert': GOOGLE_ANDROID_CERT_SHA1,
      ...(options.headers || {}),
    },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      typeof body.error === 'string'
        ? body.error
        : body.error?.message || `Places request failed (${response.status})`;
    if (response.status === 403) {
      throw new Error(
        `${message} Check that Places API (New) is enabled for this key's Google Cloud project and allowed by the key restrictions.`,
      );
    }
    throw new Error(message);
  }
  return body as T;
};

export const autocompletePlaces = (
  input: string,
  latitude?: number,
  longitude?: number,
) =>
  request<{ suggestions: any[] }>('/places:autocomplete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input,
      includedPrimaryTypes: ['restaurant'],
      languageCode: 'en',
      ...(Number.isFinite(latitude) && Number.isFinite(longitude)
        ? {
            locationBias: {
              circle: { center: { latitude, longitude }, radius: 5000 },
            },
          }
        : {}),
    }),
  }).then(data => ({
    suggestions: (data.suggestions || [])
      .map(suggestion => suggestion.placePrediction)
      .filter(Boolean)
      .map(
        prediction =>
          ({
            placeId: prediction.placeId,
            primaryText:
              prediction.structuredFormat?.mainText?.text ||
              prediction.text?.text ||
              '',
            secondaryText: prediction.structuredFormat?.secondaryText?.text,
          } as PlaceSuggestion),
      ),
  }));

export const searchNearbyRestaurants = (
  latitude: number,
  longitude: number,
  radius: number,
) =>
  request<{ places: any[] }>('/places:searchNearby', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-FieldMask':
        'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.photos',
    },
    body: JSON.stringify({
      includedTypes: ['restaurant'],
      maxResultCount: 20,
      locationRestriction: {
        circle: {
          center: { latitude, longitude },
          radius: Math.min(Math.max(radius, 1), 50000),
        },
      },
    }),
  }).then(data => ({ places: (data.places || []).map(normalizePlace) }));

export const getPlaceDetails = (placeId: string) =>
  request<any>(`/places/${encodeURIComponent(placeId)}`, {
    headers: {
      'X-Goog-FieldMask':
        'id,displayName,formattedAddress,location,rating,userRatingCount,photos',
    },
  }).then(normalizePlace);

export const getPlacePhotoUrl = (photoName: string) =>
  `${placesApiUrl}/${photoName}/media?maxHeightPx=800&maxWidthPx=800&key=${encodeURIComponent(
    GOOGLE_MAPS_API_KEY,
  )}`;
