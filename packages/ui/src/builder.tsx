import type { ReactNode } from 'react';

import { NoExperience } from './components/NoExperience';
import { Unauthorized } from './components/Unauthorized';
import { OutOfBounds } from './components/OutOfBounds';
import { withExperience } from '@whoof/auth';
import type { Sdk } from '@whop/api';
import React from 'react';

type WhopExperience = Awaited<ReturnType<Sdk["experiences"]["getExperience"]>>
type ViewProps<UserData extends Record<string, any>, AppData extends Record<string, any>> = React.ComponentType<{
	experience: WhopExperience
	user: UserData
} & AppData>

export async function AppBuilder<UserData extends Record<string, any>, AppData extends Record<string, any>>({
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
		user: ViewProps<UserData, AppData>;
		creator: ViewProps<UserData, AppData>;
		developer: ViewProps<UserData, AppData>;
	}
	appConfig: {
		appId: string,
	}
	getUser: (experienceId: string) => Promise<UserData | null>
	fetchData?: (params: {
		user: UserData
		experience: WhopExperience
	}) => Promise<AppData> | null
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
				} as { experience: WhopExperience, user: UserData } & AppData
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
						return <appView.developer {...viewProps}>{children}</appView.developer>
					case "creator":
						return <appView.creator {...viewProps}>{children}</appView.creator>
					case "user":
						return <appView.user {...viewProps}>{children}</appView.user>
					default:
						return <Unauthorized />
				}
			},
		})
	} catch (error) {
		return <NoExperience />
	}
}