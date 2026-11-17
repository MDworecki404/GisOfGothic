<script lang="ts">
	import type { SceneKind } from '../data/types.js';

	interface Props {
		kind: SceneKind;
		label: string;
	}

	let { kind, label }: Props = $props();
	const gradientId = $derived(`sky-${kind}`);
</script>

<svg viewBox="0 0 400 240" role="img" aria-label={label} preserveAspectRatio="xMidYMid slice">
	<defs>
		<linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
			<stop offset="0" stop-color="#20262a" />
			<stop offset="0.65" stop-color="#3a3a30" />
			<stop offset="1" stop-color="#6d5b36" />
		</linearGradient>
	</defs>
	<rect width="400" height="240" fill={`url(#${gradientId})`} />
	<circle cx="318" cy="64" r="22" fill="#e6d7a8" opacity="0.9" />
	<circle cx="326" cy="60" r="20" fill="#2a2f31" opacity="0.55" />
	<path
		d="M0 150 L50 118 L96 142 L150 104 L210 140 L262 112 L330 146 L400 120 L400 240 L0 240 Z"
		fill="#2a2e2b"
	/>
	<path
		d="M0 182 C80 160 150 176 220 164 C300 152 350 170 400 160 L400 240 L0 240 Z"
		fill="#1a1d1b"
	/>

	{#if kind === 'town'}
		<g fill="#121416">
			<rect x="60" y="150" width="46" height="40" />
			<path d="M54 152 L83 126 L112 152 Z" />
			<rect x="120" y="136" width="34" height="56" />
			<path d="M116 138 L137 112 L158 138 Z" />
			<rect x="170" y="108" width="24" height="86" />
			<path d="M166 110 L182 78 L198 110 Z" />
			<rect x="212" y="146" width="56" height="46" />
			<path d="M206 148 L240 120 L274 148 Z" />
			<rect x="286" y="156" width="42" height="36" />
			<path d="M280 158 L307 134 L334 158 Z" />
		</g>
		<g fill="#dbbd7c">
			<rect x="177" y="126" width="6" height="10" />
			<rect x="132" y="156" width="6" height="9" />
			<rect x="236" y="162" width="7" height="10" />
		</g>
	{:else if kind === 'farm'}
		<g fill="#121416">
			<rect x="130" y="138" width="90" height="52" />
			<path d="M120 140 L175 104 L230 140 Z" />
			<rect x="250" y="156" width="40" height="34" />
			<path d="M244 158 L270 138 L296 158 Z" />
		</g>
		<rect x="160" y="160" width="30" height="30" fill="#dbbd7c" opacity="0.5" />
		<g stroke="#121416" stroke-width="3">
			<path d="M0 200 H400 M30 190 V212 M80 190 V212 M130 190 V212 M300 190 V212 M350 190 V212" />
		</g>
	{:else if kind === 'monastery'}
		<g fill="#121416">
			<path d="M70 190 L90 120 H310 L330 190 Z" />
			<rect x="104" y="80" width="36" height="46" />
			<path d="M100 82 L122 52 L144 82 Z" />
			<rect x="260" y="80" width="36" height="46" />
			<path d="M256 82 L278 52 L300 82 Z" />
			<rect x="170" y="62" width="60" height="64" />
			<path d="M164 64 L200 28 L236 64 Z" />
		</g>
		<path d="M188 190 V160 a12 12 0 0 1 24 0 V190 Z" fill="#dbbd7c" opacity="0.75" />
		<g fill="#dbbd7c">
			<rect x="118" y="96" width="5" height="12" />
			<rect x="274" y="96" width="5" height="12" />
			<rect x="197" y="82" width="6" height="14" />
		</g>
	{:else if kind === 'tower'}
		<g fill="#121416">
			<path d="M170 192 L180 70 H220 L230 192 Z" />
			<path d="M164 72 L200 18 L236 72 Z" />
			<rect x="150" y="186" width="100" height="10" />
		</g>
		<rect x="195" y="94" width="10" height="18" fill="#dbbd7c" />
		<rect x="196" y="136" width="8" height="12" fill="#dbbd7c" opacity="0.6" />
		<g fill="#121416">
			<path
				d="M60 192 L72 160 L84 192 Z M92 192 L106 152 L120 192 Z M290 192 L304 154 L318 192 Z M326 192 L336 164 L346 192 Z"
			/>
		</g>
	{:else if kind === 'tavern'}
		<g fill="#121416">
			<rect x="110" y="132" width="150" height="58" />
			<path d="M100 134 L185 90 L270 134 Z" />
			<rect x="232" y="96" width="14" height="30" />
		</g>
		<g fill="#dbbd7c">
			<rect x="132" y="150" width="20" height="18" />
			<rect x="214" y="150" width="20" height="18" />
		</g>
		<path d="M168 190 V162 a10 10 0 0 1 20 0 V190 Z" fill="#dbbd7c" opacity="0.6" />
		<path d="M262 138 H300 M300 138 V152" stroke="#121416" stroke-width="3" />
		<rect x="286" y="152" width="28" height="18" fill="#121416" />
	{:else if kind === 'lighthouse'}
		<path d="M0 196 C60 190 110 200 170 194 C240 188 330 200 400 192 V240 H0 Z" fill="#14292d" />
		<g fill="#121416">
			<path d="M178 196 L190 70 H212 L224 196 Z" />
			<rect x="184" y="56" width="34" height="16" />
			<path d="M182 56 L201 36 L220 56 Z" />
		</g>
		<rect x="192" y="58" width="18" height="12" fill="#dbbd7c" />
		<path d="M210 64 L400 40 V86 Z" fill="#dbbd7c" opacity="0.18" />
		<path d="M192 64 L0 40 V86 Z" fill="#dbbd7c" opacity="0.1" />
	{:else if kind === 'circle'}
		<g fill="#121416">
			<path d="M92 190 L98 138 L112 134 L120 190 Z" />
			<path d="M140 196 L144 126 L162 120 L170 196 Z" />
			<path d="M222 196 L226 122 L246 126 L250 196 Z" />
			<path d="M280 190 L286 140 L302 144 L308 190 Z" />
			<path d="M172 138 H224 V148 H172 Z" />
		</g>
		<ellipse cx="200" cy="204" rx="130" ry="9" fill="#121416" opacity="0.8" />
	{:else if kind === 'mine'}
		<path d="M20 192 L60 96 L140 64 L260 70 L340 100 L380 192 Z" fill="#121416" />
		<path d="M150 192 V138 a50 50 0 0 1 100 0 V192 Z" fill="#050606" />
		<g stroke="#8d7240" stroke-width="5">
			<path d="M138 192 V132 M262 192 V132 M138 132 H262" />
		</g>
		<path d="M190 192 L200 168 L210 192 Z" fill="#dbbd7c" opacity="0.7" />
	{:else}
		<path d="M0 196 L0 70 L120 50 L150 196 Z" fill="#121416" />
		<path d="M400 196 L400 64 L270 48 L240 196 Z" fill="#121416" />
		<path
			d="M150 196 C170 170 180 140 196 110 C204 92 214 80 222 66"
			fill="none"
			stroke="#dbbd7c"
			stroke-width="3"
			stroke-dasharray="6 5"
			opacity="0.8"
		/>
	{/if}
</svg>

<style>
	svg {
		display: block;
		width: 100%;
		height: 100%;
	}
</style>
