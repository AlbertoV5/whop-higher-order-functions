import React from 'react'

export interface NoExperienceProps {
	message?: string
}

export const NoExperience = ({
	message = "This experience does not exist."
}: NoExperienceProps) => {
	return (
		<div className="flex flex-col items-center justify-center h-screen">
			<p className="text-center max-w-md">{message}</p>
		</div>
	)
} 