"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
	Check,
	Fingerprint,
	KeyRound,
	Loader2,
	LogOut,
	Plus,
	Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { updateUserProfile } from "@/app/actions/primary";
import { authClient, signOut, useSession } from "@/lib/auth/auth-client";

interface Passkey {
	id: string;
	name: string | null;
	createdAt: Date;
	deviceType: string;
}

export default function SettingsPage() {
	const { data: session, isPending } = useSession();
	const [isLoading, setIsLoading] = useState(false);

	const [editingProfile, setEditingProfile] = useState(false);
	const [nameValue, setNameValue] = useState("");

	const [isAddingPasskey, setIsAddingPasskey] = useState(false);
	const [passkeySupported, setPasskeySupported] = useState(false);
	const queryClient = useQueryClient();

	const {
		data: passkeys,
		isLoading: isLoadingPasskeys,
		refetch: refetchPasskeys,
	} = useQuery({
		queryKey: ["passkeys"],
		queryFn: async () => {
			const { data, error } = await authClient.passkey.listUserPasskeys();
			if (error) throw new Error(error.message);
			return data as Passkey[];
		},
		enabled: !!session,
	});

	const deletePasskeyMutation = useMutation({
		mutationFn: async (passkeyId: string) => {
			const { data, error } = await authClient.passkey.deletePasskey({
				id: passkeyId,
			});
			if (error) throw new Error(error.message);
			return data;
		},
		onSuccess: () => {
			toast.success("Passkey removed");
			queryClient.invalidateQueries({ queryKey: ["passkeys"] });
		},
		onError: (error) => {
			toast.error(
				error instanceof Error ? error.message : "Failed to remove passkey",
			);
		},
	});

	const router = useRouter();

	useEffect(() => {
		if (session?.user?.name) {
			setNameValue(session.user.name);
		}
	}, [session?.user?.name]);

	useEffect(() => {
		if (typeof window !== "undefined" && window.PublicKeyCredential) {
			PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable?.()
				.then(setPasskeySupported)
				.catch(() => setPasskeySupported(false));
		}
	}, []);

	const handleSignOut = async () => {
		try {
			await signOut();
		} catch (error) {
			toast.error("Failed to sign out");
		}
	};

	const handleUpdateProfile = async () => {
		setIsLoading(true);
		try {
			const formData = new FormData();
			formData.append("name", nameValue);
			const result = await updateUserProfile(formData);

			if (result.error) {
				toast.error(result.error);
			} else if (result.success) {
				toast.success(result.message || "Profile updated!");
				setEditingProfile(false);
				window.location.reload();
			}
		} catch (error) {
			toast.error("Failed to update profile");
		} finally {
			setIsLoading(false);
		}
	};

	const handleAddPasskey = async () => {
		setIsAddingPasskey(true);
		try {
			const { data, error } = await authClient.passkey.addPasskey({
				name: `${session?.user?.name || "User"}'s Passkey`,
			});

			if (error) {
				throw new Error(error.message);
			}

			toast.success(
				"Passkey added successfully! You can now use it to sign in.",
			);
			refetchPasskeys();
		} catch (error) {
			console.error("Failed to add passkey:", error);
			if (
				error instanceof Error &&
				!error.message.includes("cancelled") &&
				!error.message.includes("aborted")
			) {
				toast.error(
					error instanceof Error ? error.message : "Failed to add passkey",
				);
			}
		} finally {
			setIsAddingPasskey(false);
		}
	};

	const handleDeletePasskey = async (passkeyId: string) => {
		if (
			!confirm(
				"Are you sure you want to remove this passkey? You will no longer be able to use it to sign in.",
			)
		) {
			return;
		}
		deletePasskeyMutation.mutate(passkeyId);
	};

	if (isPending) {
		return (
			<div className="min-h-screen bg-[#fafaf9] flex items-center justify-center">
				<div className="text-[#78716c]">Loading…</div>
			</div>
		);
	}

	if (!session) {
		router.push("/login");
		return null;
	}

	return (
		<div className="min-h-screen bg-[#fafaf9] text-[#1c1917] selection:bg-[#8161FF]/20 p-4">
			<div className="max-w-5xl mx-auto px-2">
				<header className="mb-6 pt-2">
					<h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
					<p className="text-[#52525b] text-sm mt-1">
						Manage your account settings.
					</p>
				</header>

				{/* Profile */}
				<section className="py-8 border-t border-[#e7e5e4]">
					<h2 className="font-heading text-lg font-semibold tracking-tight mb-6">
						Profile
					</h2>

					<div className="space-y-4">
						<div className="flex items-center justify-between py-3 border-b border-[#e7e5e4]">
							<div>
								<p className="text-sm text-[#78716c]">Name</p>
								{editingProfile ? (
									<input
										type="text"
										value={nameValue}
										onChange={(e) => setNameValue(e.target.value)}
										className="mt-1 w-full max-w-xs px-3 py-1.5 text-sm bg-white border border-[#e7e5e4] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8161FF]/20 focus:border-[#8161FF]"
										autoFocus
									/>
								) : (
									<p className="text-[#1c1917]">{session.user.name || "—"}</p>
								)}
							</div>
							{editingProfile ? (
								<div className="flex items-center gap-2">
									<button
										onClick={() => {
											setEditingProfile(false);
											setNameValue(session.user.name || "");
										}}
										className="text-sm text-[#52525b] hover:text-[#1c1917] transition-colors"
									>
										Cancel
									</button>
									<button
										onClick={handleUpdateProfile}
										disabled={isLoading || !nameValue.trim()}
										className="bg-[#8161FF] hover:bg-[#6b4fd9] disabled:opacity-50 text-white text-sm px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
									>
										{isLoading ? (
											<Loader2 className="w-3.5 h-3.5 animate-spin" />
										) : (
											<Check className="w-3.5 h-3.5" />
										)}
										Save
									</button>
								</div>
							) : (
								<button
									onClick={() => setEditingProfile(true)}
									className="text-sm text-[#8161FF] hover:underline"
								>
									Edit
								</button>
							)}
						</div>

						<div className="flex items-center justify-between py-3 border-b border-[#e7e5e4]">
							<div>
								<p className="text-sm text-[#78716c]">Email</p>
								<p className="text-[#1c1917]">{session.user.email}</p>
							</div>
							<span
								className={`text-xs px-2 py-0.5 rounded-full ${
									session.user.emailVerified
										? "bg-[#dcfce7] text-[#166534]"
										: "bg-[#fef3c7] text-[#92400e]"
								}`}
							>
								{session.user.emailVerified ? "Verified" : "Unverified"}
							</span>
						</div>

						<div className="flex items-center justify-between py-3 border-b border-[#e7e5e4]">
							<div>
								<p className="text-sm text-[#78716c]">Member since</p>
								<p className="text-[#1c1917]">
									{new Date(session.user.createdAt).toLocaleDateString(
										"en-US",
										{
											month: "long",
											year: "numeric",
										},
									)}
								</p>
							</div>
						</div>
					</div>
				</section>

				{/* Passkeys / Security */}
				<section className="py-8 border-t border-[#e7e5e4]">
					<div className="flex items-start justify-between mb-6">
						<div>
							<h2 className="font-heading text-lg font-semibold tracking-tight flex items-center gap-2">
								<KeyRound className="w-5 h-5" />
								Passkeys
							</h2>
							<p className="text-sm text-[#52525b] mt-1">
								Sign in securely with fingerprint, face, or device PIN.
							</p>
						</div>
						{passkeySupported && (
							<button
								onClick={handleAddPasskey}
								disabled={isAddingPasskey}
								className="bg-[#8161FF] hover:bg-[#6b4fd9] disabled:opacity-50 text-white text-sm px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
							>
								{isAddingPasskey ? (
									<>
										<Loader2 className="w-3.5 h-3.5 animate-spin" />
										Adding…
									</>
								) : (
									<>
										<Plus className="w-3.5 h-3.5" />
										Add passkey
									</>
								)}
							</button>
						)}
					</div>

					{!passkeySupported ? (
						<div className="p-4 bg-[#fef3c7] border border-[#fde68a] rounded-lg">
							<p className="text-sm text-[#92400e]">
								Passkeys are not supported on this device or browser. Try using
								a modern browser like Chrome, Safari, or Edge.
							</p>
						</div>
					) : isLoadingPasskeys ? (
						<div className="space-y-3">
							<div className="h-16 bg-[#e7e5e4] rounded-lg animate-pulse" />
							<div className="h-16 bg-[#e7e5e4] rounded-lg animate-pulse" />
						</div>
					) : passkeys && passkeys.length > 0 ? (
						<div className="space-y-2">
							{passkeys.map((passkey) => (
								<div
									key={passkey.id}
									className="flex items-center justify-between py-3 px-4 bg-[#f5f5f4] rounded-lg"
								>
									<div className="flex items-center gap-3">
										<div className="w-10 h-10 bg-[#e7e5e4] rounded-full flex items-center justify-center">
											<Fingerprint className="w-5 h-5 text-[#52525b]" />
										</div>
										<div>
											<p className="font-medium text-[#1c1917]">
												{passkey.name || "Passkey"}
											</p>
											<p className="text-xs text-[#78716c]">
												Added{" "}
												{new Date(passkey.createdAt).toLocaleDateString(
													"en-US",
													{
														month: "short",
														day: "numeric",
														year: "numeric",
													},
												)}
												{passkey.deviceType && ` · ${passkey.deviceType}`}
											</p>
										</div>
									</div>
									<button
										onClick={() => handleDeletePasskey(passkey.id)}
										disabled={deletePasskeyMutation.isPending}
										className="text-[#78716c] hover:text-[#dc2626] transition-colors p-2 rounded-lg hover:bg-[#fef2f2]"
										title="Remove passkey"
									>
										{deletePasskeyMutation.isPending ? (
											<Loader2 className="w-4 h-4 animate-spin" />
										) : (
											<Trash2 className="w-4 h-4" />
										)}
									</button>
								</div>
							))}
						</div>
					) : (
						<div className="text-center py-8 px-4 bg-[#f5f5f4] rounded-lg">
							<Fingerprint className="w-10 h-10 text-[#a8a29e] mx-auto mb-3" />
							<p className="text-[#52525b] mb-1">No passkeys yet</p>
							<p className="text-sm text-[#78716c]">
								Add a passkey to sign in faster and more securely using your
								device's biometrics.
							</p>
						</div>
					)}
				</section>

				{/* Sign out */}
				<section className="py-8 border-t border-[#e7e5e4]">
					<button
						onClick={handleSignOut}
						className="text-[#52525b] hover:text-[#1c1917] transition-colors flex items-center gap-2 text-sm"
					>
						<LogOut className="w-4 h-4" />
						Sign out
					</button>
				</section>
			</div>
		</div>
	);
}
