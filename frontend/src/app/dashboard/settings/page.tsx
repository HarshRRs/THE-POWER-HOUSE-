"use client";

import { useEffect, useState } from "react";
import { useAuth, getErrorMessage } from "@/context/auth";
import api from "@/lib/api";
import Toast from "@/components/Toast";

export default function SettingsPage() {
    const { user, refreshUser } = useAuth();
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [telegramChatId, setTelegramChatId] = useState("");
    const [notifyEmail, setNotifyEmail] = useState(true);
    const [notifyTelegram, setNotifyTelegram] = useState(false);
    const [notifySms, setNotifySms] = useState(false);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    useEffect(() => {
        if (user) {
            setEmail(user.email || "");
            setPhone(user.phone || "");
            setTelegramChatId(user.telegramChatId || "");
            setNotifyEmail(user.notifyEmail ?? true);
            setNotifyTelegram(user.notifyTelegram ?? false);
            setNotifySms(user.notifySms ?? false);
        }
    }, [user]);

    const saveProfile = async () => {
        setSaving(true);
        try {
            await api.patch("/users/profile", { phone: phone || null, telegramChatId: telegramChatId || null });
            await api.patch("/users/notifications", { notifyEmail, notifyTelegram, notifySms });
            await refreshUser();
            setToast({ message: "Paramètres sauvegardés !", type: "success" });
        } catch (err) {
            setToast({ message: getErrorMessage(err), type: "error" });
        } finally {
            setSaving(false);
        }
    };

    const smsAvailable = user?.plan === "URGENCE_TOTAL";

    return (
        <div className="space-y-6 max-w-xl">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Profile Section */}
            <section className="bg-white rounded-2xl card-shadow p-6">
                <h2 className="text-sm font-black text-gray-900 uppercase tracking-wide mb-4 flex items-center gap-2">👤 Profil</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-2">Email</label>
                        <input type="email" value={email} disabled className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 bg-gray-100 text-sm text-gray-500 cursor-not-allowed" />
                        <p className="text-[10px] text-gray-400 mt-1">L&apos;email ne peut pas être modifié</p>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-2">Téléphone</label>
                        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+33 6 12 34 56 78" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary outline-none text-sm bg-gray-50 focus:bg-white transition-colors" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-2">Telegram Chat ID</label>
                        <input type="text" value={telegramChatId} onChange={(e) => setTelegramChatId(e.target.value)} placeholder="123456789" className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary outline-none text-sm bg-gray-50 focus:bg-white transition-colors" />
                        <div className="mt-2 bg-info-light rounded-lg p-3">
                            <p className="text-[10px] text-gray-600">
                                <span className="font-bold">💡 Comment obtenir votre Chat ID :</span><br />
                                1. Ouvrez Telegram et cherchez <span className="font-bold">@RDVPriorityBot</span><br />
                                2. Envoyez <span className="font-mono bg-white px-1 rounded">/start</span><br />
                                3. Le bot vous enverra votre Chat ID
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Notification Preferences */}
            <section className="bg-white rounded-2xl card-shadow p-6">
                <h2 className="text-sm font-black text-gray-900 uppercase tracking-wide mb-4 flex items-center gap-2">🔔 Notifications</h2>
                <div className="space-y-3">
                    {/* Email */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                        <div className="flex items-center gap-3">
                            <span className="text-lg">📧</span>
                            <div>
                                <p className="text-xs font-bold text-gray-900">Email</p>
                                <p className="text-[10px] text-gray-400">Recevoir les alertes par email</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setNotifyEmail(!notifyEmail)}
                            className={`w-12 h-6 rounded-full p-0.5 transition-colors ${notifyEmail ? "bg-success" : "bg-gray-300"}`}
                        >
                            <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${notifyEmail ? "translate-x-6" : "translate-x-0"}`} />
                        </button>
                    </div>

                    {/* Telegram */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                        <div className="flex items-center gap-3">
                            <span className="text-lg">✈️</span>
                            <div>
                                <p className="text-xs font-bold text-gray-900">Telegram</p>
                                <p className="text-[10px] text-gray-400">Alertes ultra-rapides par Telegram</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setNotifyTelegram(!notifyTelegram)}
                            className={`w-12 h-6 rounded-full p-0.5 transition-colors ${notifyTelegram ? "bg-success" : "bg-gray-300"}`}
                        >
                            <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${notifyTelegram ? "translate-x-6" : "translate-x-0"}`} />
                        </button>
                    </div>

                    {/* SMS */}
                    <div className={`flex items-center justify-between p-3 rounded-xl ${smsAvailable ? "bg-gray-50" : "bg-gray-50 opacity-60"}`}>
                        <div className="flex items-center gap-3">
                            <span className="text-lg">💬</span>
                            <div>
                                <p className="text-xs font-bold text-gray-900">SMS</p>
                                <p className="text-[10px] text-gray-400">
                                    {smsAvailable ? "Alertes SMS directes" : "Disponible avec Urgence Totale"}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => smsAvailable && setNotifySms(!notifySms)}
                            disabled={!smsAvailable}
                            className={`w-12 h-6 rounded-full p-0.5 transition-colors ${notifySms && smsAvailable ? "bg-success" : "bg-gray-300"} ${!smsAvailable ? "cursor-not-allowed" : ""}`}
                        >
                            <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${notifySms && smsAvailable ? "translate-x-6" : "translate-x-0"}`} />
                        </button>
                    </div>
                </div>
            </section>

            {/* Save Button */}
            <button
                onClick={saveProfile}
                disabled={saving}
                className="w-full gradient-primary text-white py-4 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
            >
                {saving ? (
                    <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sauvegarde...
                    </span>
                ) : "💾 Sauvegarder les paramètres"}
            </button>
        </div>
    );
}
