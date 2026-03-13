"use client";

import { useRouter } from "next/navigation";
import { PricingTable, plans } from "@/components/pricing-table";
import { useSession } from "@/lib/auth/auth-client";

export function PricingInteractive() {
	const { data: session } = useSession();
	const router = useRouter();

	const handlePlanSelection = async (plan: (typeof plans)[0]) => {
		if (!session?.user) {
			router.push("/login");
			return;
		}

		router.push("/settings/billing");
	};

	return (
		<PricingTable
			showHeader={false}
			onPlanSelect={handlePlanSelection}
			isLoading={null}
			currentPlan={null}
		/>
	);
}
