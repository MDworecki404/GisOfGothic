import type { Place } from './types.js';

/**
 * Stały klucz miejsca w obrębie wpisu: rodzaj miejsca i identyfikator obiektu z warstwy GeoJSON (`ref`),
 * a gdy go brak, współrzędne. Nie zależy od kolejności miejsc w indeksie, więc przeżywa ponowny eksport danych.
 */
export function buildPlaceKey(place: Place): string {
	return `${place.kind}:${place.ref ?? `${place.lon},${place.lat}`}`;
}

/** Miejsce, które da się odhaczyć jako zebrane: prawdziwe miejsce przedmiotu, nie losowy łup Gothica 3. */
export function isCollectiblePlace(place: Place): boolean {
	return place.set === undefined;
}
