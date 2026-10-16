export interface ModelBounds {
	x: number;
	y: number;
	z: number;
}

export interface ProtectedModelContent {
	bounds: ModelBounds;
	glb: Uint8Array<ArrayBuffer>;
}

const MAGIC = new TextEncoder().encode('GGM1');
const IV_LENGTH = 12;
const HEADER_LENGTH_BYTES = 4;
const FILE_ID_HEX_LENGTH = 32;
const NAMING_KEY_LABEL = new TextEncoder().encode('gis-of-gothic/nazwy-plikow');

function decodeBase64(base64: string): Uint8Array<ArrayBuffer> {
	const binary = atob(base64);
	const bytes = new Uint8Array(binary.length);
	for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
	return bytes;
}

function toHex(bytes: Uint8Array): string {
	return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function concatenate(...parts: Uint8Array[]): Uint8Array<ArrayBuffer> {
	const result = new Uint8Array(parts.reduce((length, part) => length + part.length, 0));
	let offset = 0;
	for (const part of parts) {
		result.set(part, offset);
		offset += part.length;
	}
	return result;
}

function isModelBounds(value: unknown): value is ModelBounds {
	return (
		typeof value === 'object' &&
		value !== null &&
		'x' in value &&
		typeof value.x === 'number' &&
		'y' in value &&
		typeof value.y === 'number' &&
		'z' in value &&
		typeof value.z === 'number'
	);
}

/**
 * Format chronionego modelu przedmiotu: `GGM1` + 12 bajtów IV + AES-GCM(długość nagłówka,
 * nagłówek JSON z wymiarami, plik GLB z wbudowanymi teksturami). Nazwa pliku to HMAC ścieżki
 * modelu, więc bez klucza nie da się zgadnąć nazw ani złożyć spisu plików.
 *
 * To utrudnienie, a nie zabezpieczenie nie do złamania: klucz musi trafić do przeglądarki,
 * żeby model dało się wyświetlić.
 */
export class ProtectedModelCodec {
	private readonly encryptionKey: Promise<CryptoKey>;
	private readonly namingKey: Promise<CryptoKey>;

	constructor(base64Key: string) {
		const keyBytes = decodeBase64(base64Key);
		this.encryptionKey = crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, [
			'encrypt',
			'decrypt'
		]);
		this.namingKey = crypto.subtle
			.digest('SHA-256', concatenate(keyBytes, NAMING_KEY_LABEL))
			.then((namingBytes) =>
				crypto.subtle.importKey('raw', namingBytes, { name: 'HMAC', hash: 'SHA-256' }, false, [
					'sign'
				])
			);
	}

	async createFileId(modelPath: string): Promise<string> {
		const signature = await crypto.subtle.sign(
			'HMAC',
			await this.namingKey,
			new TextEncoder().encode(modelPath)
		);
		return toHex(new Uint8Array(signature)).slice(0, FILE_ID_HEX_LENGTH);
	}

	async encrypt(content: ProtectedModelContent): Promise<Uint8Array<ArrayBuffer>> {
		const header = new TextEncoder().encode(JSON.stringify({ bounds: content.bounds }));
		const headerLength = new Uint8Array(HEADER_LENGTH_BYTES);
		new DataView(headerLength.buffer).setUint32(0, header.length);
		const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
		const ciphertext = await crypto.subtle.encrypt(
			{ name: 'AES-GCM', iv },
			await this.encryptionKey,
			concatenate(headerLength, header, content.glb)
		);
		return concatenate(MAGIC, iv, new Uint8Array(ciphertext));
	}

	async decrypt(bytes: Uint8Array<ArrayBuffer>): Promise<ProtectedModelContent> {
		const magic = bytes.subarray(0, MAGIC.length);
		if (!magic.every((byte, index) => byte === MAGIC[index])) {
			throw new Error('To nie jest chroniony model GIS of Gothic');
		}
		const iv = bytes.slice(MAGIC.length, MAGIC.length + IV_LENGTH);
		const plaintext = new Uint8Array(
			await crypto.subtle.decrypt(
				{ name: 'AES-GCM', iv },
				await this.encryptionKey,
				bytes.slice(MAGIC.length + IV_LENGTH)
			)
		);
		const headerLength = new DataView(plaintext.buffer).getUint32(0);
		const headerEnd = HEADER_LENGTH_BYTES + headerLength;
		const header: unknown = JSON.parse(
			new TextDecoder().decode(plaintext.subarray(HEADER_LENGTH_BYTES, headerEnd))
		);
		const bounds =
			typeof header === 'object' && header !== null && 'bounds' in header ? header.bounds : null;
		if (!isModelBounds(bounds)) throw new Error('Chroniony model nie ma poprawnych wymiarów');
		return { bounds, glb: plaintext.slice(headerEnd) };
	}
}
