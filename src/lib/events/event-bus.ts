export interface BusEvent {
	readonly type: string;
}

export type EventOfType<E extends BusEvent, T extends E['type']> = Extract<E, { type: T }>;

function isEventOfType<E extends BusEvent, T extends E['type']>(
	event: E,
	type: T
): event is EventOfType<E, T> {
	return event.type === type;
}

export class EventBus<E extends BusEvent> {
	private readonly listeners = new Set<(event: E) => void>();

	publish(event: E): void {
		for (const listener of [...this.listeners]) listener(event);
	}

	subscribe<T extends E['type']>(type: T, handler: (event: EventOfType<E, T>) => void): () => void {
		const listener = (event: E): void => {
			if (isEventOfType(event, type)) handler(event);
		};
		this.listeners.add(listener);
		return () => {
			this.listeners.delete(listener);
		};
	}
}
