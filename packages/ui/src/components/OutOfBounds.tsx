import React from 'react'

export interface OutOfBoundsProps {
	appId: string
	message?: string
	installUrl?: string
}

export const OutOfBounds = ({
	appId,
	message = "Please install this app via Whop.",
	installUrl
}: OutOfBoundsProps) => {
	const defaultInstallUrl = `https://whop.com/apps/${appId}/install/`
	const finalInstallUrl = installUrl || defaultInstallUrl

	return (
		<div className="flex flex-col items-center justify-center h-screen">
			<p>
				{message.split('install').length > 1 ? (
					<>
						{message.split('install')[0]}
						<a
							className="text-blue-9 hover:text-blue-10"
							href={finalInstallUrl}
						>
							install
						</a>
						{message.split('install')[1]}
					</>
				) : (
					<>
						{message}{' '}
						<a
							className="text-blue-9 hover:text-blue-10"
							href={finalInstallUrl}
						>
							Install here
						</a>
					</>
				)}
			</p>
		</div>
	)
} 