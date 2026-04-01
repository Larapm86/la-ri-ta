import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
	const n = Number(params.id);
	if (!Number.isInteger(n) || n < 1 || n > 3) {
		error(404, 'House not found');
	}
	const labels = ['Work', 'About', 'Postal'] as const;
	return { houseId: n, label: labels[n - 1] };
};
