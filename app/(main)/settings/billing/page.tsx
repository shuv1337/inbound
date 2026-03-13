"use client";

import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth/auth-client";

export default function BillingPage() {
	const { data: session, isPending } = useSession();
	const router = useRouter();

	if (isPending) {
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="text-muted-foreground">Loading…</div>
			</div>
		);
	}

	if (!session) {
		router.push("/login");
		return null;
	}

	return (
		<div className="min-h-screen p-4">
			<div className="max-w-3xl mx-auto">
				<header className="mb-8 pt-2">
					<h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
					<p className="text-muted-foreground text-sm mt-1">
						Manage your subscription and billing.
					</p>
				</header>

				<section className="mb-8 p-6 border rounded-lg bg-card">
					<div className="flex items-center gap-3 mb-4">
						<div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
							<Check className="w-5 h-5 text-green-600" />
						</div>
						<div>
							<h2 className="text-xl font-semibold">Self-hosted</h2>
							<p className="text-muted-foreground text-sm">
								All features unlimited
							</p>
						</div>
					</div>
					<p className="text-sm text-muted-foreground">
						You are running a self-hosted instance. All features are available
						with no usage limits.
					</p>
				</section>
			</div>
		</div>
	);
}
