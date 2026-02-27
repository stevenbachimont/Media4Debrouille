import type { LayoutLoad } from './$types';

export const ssr = false;

export const load: LayoutLoad = async ({ params }) => {
	return { screenId: params.screenId };
};
