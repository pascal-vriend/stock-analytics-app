"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApi } from "@/lib/useApi";

import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import SettingsCard from "@/components/settings/settingsCard";

type Tab = "myHouse" | "personalInfo" | "preferences";

export default function SettingsPage() {
    const router = useRouter();
    const { apiFetch } = useApi();

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [user, setUser] = useState<{ id: string; email: string; username?: string; profile_picture?: string } | null>(null);
    const [house, setHouse] = useState<{ id: string; name: string; inviteCode: string; inviteLink?: string; roommates?: any[] } | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState<Tab>("myHouse"); // default tab

    useEffect(() => {
        const fetchData = async () => {
            try {
                const meRes = await apiFetch("https://localhost:8080/auth/me");
                if (!meRes.ok) throw new Error("Failed to fetch user info");
                const userData = await meRes.json();
                setUser(userData);

                const houseIdRes = await apiFetch(`https://localhost:8080/houses/by-user/${userData.id}`);
                if (!houseIdRes.ok) throw new Error("Failed to fetch house id");
                const houseId = await houseIdRes.json();

                const houseRes = await apiFetch(`https://localhost:8080/houses/${houseId}`);
                if (!houseRes.ok) throw new Error("Failed to fetch house info");
                const houseData = await houseRes.json();
                setHouse(houseData);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleLeaveHouse = async () => {
        if (!house || !user) return;
        if (!confirm("Are you sure you want to leave this house?")) return;

        try {
            const res = await apiFetch(`https://localhost:8080/houses/${house.id}/leave`, { method: "POST" });
            if (!res.ok) throw new Error("Failed to leave house");
            router.push("/onboarding");
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleRegenerateInvite = async () => {
        if (!house || !user) return;
        try {
            const res = await apiFetch(
                `https://localhost:8080/houses/${house.id}/join-code/regenerate?requesterId=${user.id}`,
                { method: "POST" }
            );
            if (!res.ok) throw new Error("Failed to regenerate invite code");

            const data = await res.json();
            setHouse({ ...house, inviteCode: data.code, inviteLink: data.link });
        } catch (err: any) {
            alert(err.message);
        }
    };

    // Mini tab header styles
    const tabs: { label: string; key: Tab }[] = [
        { label: "My House", key: "myHouse" },
        { label: "Personal Info", key: "personalInfo" },
        { label: "Preferences", key: "preferences" },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
            <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
            <div className="flex">
                <Sidebar isOpen={sidebarOpen} currentHref="/settings" />
                <main className="flex-1 p-6 lg:p-8 max-w-4xl mx-auto">
                    {loading ? (
                        <p>Loading...</p>
                    ) : error ? (
                        <p className="text-red-500">{error}</p>
                    ) : (
                        <>
                            <h1 className="text-3xl font-bold mb-6">Settings</h1>

                            {/* Mini tab header */}
                            <div className="flex border-b border-gray-300 mb-6">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.key}
                                        onClick={() => setActiveTab(tab.key)}
                                        className={`mr-6 pb-2 font-medium ${
                                            activeTab === tab.key
                                                ? "border-b-2 border-blue-600 text-blue-600"
                                                : "text-gray-500 hover:text-gray-700"
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Tab content */}
                            {activeTab === "myHouse" && house && (
                                <SettingsCard
                                    title="My House"
                                    settings={[
                                        {
                                            label: "Name",
                                            value: house.name,
                                            action: { type: "edit", onClick: () => {
                                                    const newName = prompt("Enter new house name:", house.name);
                                                    if (!newName) return;
                                                    // API call to update house name
                                                    apiFetch(`https://localhost:8080/houses/${house.id}/rename`, {
                                                        method: "POST",
                                                        body: JSON.stringify({ name: newName }),
                                                        headers: { "Content-Type": "application/json" },
                                                    }).then(res => {
                                                        if (!res.ok) throw new Error("Failed to update house name");
                                                        setHouse({ ...house, name: newName });
                                                    }).catch(err => alert(err.message));
                                                } },
                                        },
                                        {
                                            label: "Invite Code",
                                            value: (
                                                <>
                                                    {house.inviteCode}
                                                    {house.inviteLink && (
                                                        <p className="text-sm text-gray-500 mt-1">
                                                            Or invite a member using this link: <span className="break-all">{house.inviteLink}</span>
                                                        </p>
                                                    )}
                                                </>
                                            ),
                                            action: { type: "refresh", onClick: handleRegenerateInvite },
                                        },
                                        {
                                            label: "Roommates",
                                            value: house.roommates,
                                            action: { type: "edit", onClick: handleRegenerateInvite },
                                        },
                                        {
                                            label: "",
                                            value: "",
                                            action: { type: "button", label: "Leave", onClick: handleLeaveHouse },
                                        },
                                    ]}
                                />
                            )}

                            {activeTab === "personalInfo" && user && (
                                <SettingsCard
                                    title="Personal Info"
                                    settings={[
                                        {
                                            label: "Name",
                                            value: user.username || "-",
                                            action: { type: "edit", onClick: () => {
                                                    const newUsername = prompt("Enter new username:", user.username || "");
                                                    if (!newUsername) return;
                                                    apiFetch(`https://localhost:8080/auth/update-username`, {
                                                        method: "POST",
                                                        body: JSON.stringify({ username: newUsername }),
                                                        headers: { "Content-Type": "application/json" },
                                                    }).then(res => {
                                                        if (!res.ok) throw new Error("Failed to update username");
                                                        setUser({ ...user, username: newUsername });
                                                    }).catch(err => alert(err.message));
                                                } },
                                        },
                                        {
                                            label: "Email",
                                            value: user.email,
                                            action: { type: "edit", onClick: () => {
                                                    const newEmail = prompt("Enter new email:", user.email);
                                                    if (!newEmail) return;
                                                    apiFetch(`https://localhost:8080/auth/update-email`, {
                                                        method: "POST",
                                                        body: JSON.stringify({ email: newEmail }),
                                                        headers: { "Content-Type": "application/json" },
                                                    }).then(res => {
                                                        if (!res.ok) throw new Error("Failed to update email");
                                                        setUser({ ...user, email: newEmail });
                                                    }).catch(err => alert(err.message));
                                                } },
                                        },
                                        {
                                            label: "Profile Picture",
                                            value: user.profile_picture ? (
                                                <img src={user.profile_picture} alt="Profile" className="w-16 h-16 rounded-full" />
                                            ) : (
                                                "No profile picture"
                                            ),
                                            action: { type: "edit", onClick: () => {
                                                    const newUrl = prompt("Enter new profile picture URL:", user.profile_picture || "");
                                                    if (!newUrl) return;
                                                    apiFetch(`https://localhost:8080/auth/update-profile-picture`, {
                                                        method: "POST",
                                                        body: JSON.stringify({ profile_picture: newUrl }),
                                                        headers: { "Content-Type": "application/json" },
                                                    }).then(res => {
                                                        if (!res.ok) throw new Error("Failed to update profile picture");
                                                        setUser({ ...user, profile_picture: newUrl });
                                                    }).catch(err => alert(err.message));
                                                } },
                                        },
                                    ]}
                                />
                            )}

                            {activeTab === "preferences" && user && (
                                <SettingsCard
                                    title="Preferences"
                                    settings={[
                                        {
                                            label: "Notifications",
                                            value: "",
                                            action: {
                                                type: "toggle",
                                                enabled: true,
                                                onToggle: (val) => {
                                                    apiFetch(`https://localhost:8080/users/${user.id}/preferences/notifications`, {
                                                        method: "POST",
                                                        body: JSON.stringify({ enabled: val }),
                                                        headers: { "Content-Type": "application/json" },
                                                    }).then(res => {
                                                        if (!res.ok) throw new Error("Failed to update notifications");
                                                    }).catch(err => alert(err.message));
                                                },
                                            },
                                        },
                                        {
                                            label: "Theme",
                                            value: "Light",
                                            action: {
                                                type: "dropdown",
                                                options: ["Light", "Dark", "System"],
                                                value: "Light", // could also come from user preferences
                                                onChange: (val) => {
                                                    // Example: save theme preference
                                                    apiFetch(`https://localhost:8080/users/${user.id}/preferences/theme`, {
                                                        method: "POST",
                                                        body: JSON.stringify({ theme: val }),
                                                        headers: { "Content-Type": "application/json" },
                                                    }).then(res => {
                                                        if (!res.ok) throw new Error("Failed to update theme");
                                                    }).catch(err => alert(err.message));
                                                },
                                            },
                                        },
                                        {
                                            label: "",
                                            value: "",
                                            action: { type: "button", label: "Delete Account", onClick: () => {
                                                    if (!confirm("Are you sure you want to delete your account? This cannot be undone.")) return;
                                                    apiFetch(`https://localhost:8080/auth/delete-account`, { method: "POST" })
                                                        .then(res => {
                                                            if (!res.ok) throw new Error("Failed to delete account");
                                                            router.push("/onboarding");
                                                        })
                                                        .catch(err => alert(err.message));
                                                } },
                                        },
                                    ]}
                                />
                            )}

                        </>
                    )}
                </main>
            </div>

            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </div>
    );
}
