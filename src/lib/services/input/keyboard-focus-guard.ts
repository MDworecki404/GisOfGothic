const ELEMENTS_USING_KEYS_THEMSELVES =
	'input, textarea, select, [contenteditable], [role="slider"], [role="dialog"], [role="listbox"], [role="menu"]';

interface ClosestSearchable {
	closest(selector: string): unknown;
}

function canSearchClosest(target: EventTarget | null): target is EventTarget & ClosestSearchable {
	return target !== null && 'closest' in target && typeof target.closest === 'function';
}

/**
 * Czy cel zdarzenia klawiatury (pole tekstowe, suwak, okno dialogowe, lista, menu) sam używa klawiszy,
 * więc globalne skróty mapy nie powinny ich przejmować.
 */
export function isKeyboardTargetUsingKeysItself(target: EventTarget | null): boolean {
	return canSearchClosest(target) && target.closest(ELEMENTS_USING_KEYS_THEMSELVES) !== null;
}
