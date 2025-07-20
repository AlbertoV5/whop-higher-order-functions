import React from 'react'

export interface UnauthorizedProps {
	message?: string
	showPurchaseLink?: boolean
	purchaseUrl?: string
}

export const Unauthorized = ({
	message = "You are not authorized to view this page. You must purchase a product first.",
	showPurchaseLink = false,
	purchaseUrl
}: UnauthorizedProps) => {
	return (
		<div className="flex flex-col items-center justify-center h-screen space-y-4">
			<p className="text-center max-w-md">{message}</p>
			{showPurchaseLink && purchaseUrl && (
				<a
					className="text-blue-9 hover:text-blue-10 font-medium"
					href={purchaseUrl}
				>
					Purchase Access
				</a>
			)}
		</div>
	)
} 