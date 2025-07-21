import type { UserData, WhopExperience } from '@whoof/auth';
import type { ReactNode } from 'react';

import { NoExperience } from './components/NoExperience';
import { Unauthorized } from './components/Unauthorized';
import { OutOfBounds } from './components/OutOfBounds';
import { withExperience } from '@whoof/auth';
import type { Sdk } from '@whop/api';
import React from 'react';

type ViewType<TData extends Record<string, any>> = React.ComponentType<{
	experience: WhopExperience
	user: UserData
} & TData>

export async function AppBuilder<TData extends Record<string, any>>({
	children,
	params,
	whopSdk,
	appConfig,
	appView,
	getUser,
	fetchData,
}: {
	children: ReactNode
	params: Promise<{ experienceId: string }>
	whopSdk: Sdk
	appView: {
		user: ViewType<TData>;
		creator: ViewType<TData>;
		developer: ViewType<TData>;
	}
	appConfig: {
		appId: string,
	}
	getUser: (experienceId: string) => Promise<UserData | null>
	fetchData?: (params: {
		user: UserData
		experience: WhopExperience
	}) => Promise<TData> | null
}) {
	const { appId } = appConfig;
	const { experienceId } = await params;
	if (!experienceId) {
		return <OutOfBounds appId={appId} />
	}
	try {
		return await withExperience({
			sdk: whopSdk,
			experienceId,
			view: async (experience) => {
				const user = await getUser(experience.id)
				if (!user) {
					return <Unauthorized />
				}
				let viewProps = {
					experience,
					user,
				} as { experience: WhopExperience, user: UserData } & TData
				if (fetchData) {
					const data = await fetchData({ user, experience })
					if (data) {
						viewProps = {
							...viewProps,
							...data
						}
					}
				}
				// Render view based on user status
				switch (user.userStatus) {
					case "developer":
						return <appView.developer {...viewProps} />
					case "creator":
						return <appView.creator {...viewProps} />
					case "user":
						return <appView.user {...viewProps} />
					default:
						return <Unauthorized />
				}
			},
		})
	} catch (error) {
		return <NoExperience />
	}
}