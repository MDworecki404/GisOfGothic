import GemIcon from '@lucide/svelte/icons/gem';
import LandmarkIcon from '@lucide/svelte/icons/landmark';
import ScrollTextIcon from '@lucide/svelte/icons/scroll-text';
import SkullIcon from '@lucide/svelte/icons/skull';
import UserIcon from '@lucide/svelte/icons/user';
import type { Component } from 'svelte';
import type { Category } from './types.js';

export const CATEGORY_ICONS: Readonly<Record<Category, Component>> = {
	location: LandmarkIcon,
	character: UserIcon,
	item: GemIcon,
	monster: SkullIcon,
	quest: ScrollTextIcon
};
