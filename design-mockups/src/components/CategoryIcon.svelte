<script lang="ts">
	import { CATEGORY_ICONS } from '../data/category-icons.js';
	import { findCategoryDefinition } from '../data/categories.js';
	import type { Category } from '../data/types.js';

	interface Props {
		category: Category;
		size?: number;
		tinted?: boolean;
	}

	let { category, size = 16, tinted = true }: Props = $props();
	const Icon = $derived(CATEGORY_ICONS[category]);
	const color = $derived(`var(${findCategoryDefinition(category).colorVariable})`);
</script>

<Icon {size} strokeWidth={1.75} aria-hidden="true" style={tinted ? `color: ${color}` : ''} />
