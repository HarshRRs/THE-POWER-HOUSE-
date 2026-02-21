"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import api, { getErrorMessage } from "@/lib/api";

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token") || "";
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirm) {
            setError("Les mots de passe ne correspondent pas");
            return;
        }
        if (password.length < 8) {
            setError("Le mot de passe doit contenir au moins 8 caracteres");
            return;
        }
        setLoading(true);
        setError("");
        try {
            await api.post("/auth/reset-password", { token, password });
            setDone(true);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="bg-accent-light border border-accent/20 text-accent rounded-xl p-4 text-sm">
                <p className="font-bold">Lien invalide</p>
                <p className="mt-1">Ce lien de reinitialisation est invalide ou a expire.</p>
                <Link href="/forgot-password" className="mt-3 inline-block text-primary font-bold hover:underline">
                    Demander un nouveau lien
                </Link>
            </div>
        );
    }

    if (done) {
        return (
            <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-4 text-sm">
                <p className="font-bold mb-1">Mot de passe reinitialise !</p>
                <p>Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.</p>
                <Link href="/login" className="mt-4 inline-block gradient-primary text-white px-6 py-2.5 rounded-lg font-bold text-sm hover:opacity-90">
                    Se connecter
                </Link>
            </div>
        );
    }

    return (
        <>
            {error && (
                <div className="mb-4 bg-accent-light border border-accent/20 text-accent rounded-xl p-3 text-sm font-semibold animate-fade-in">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Nouveau mot de passe</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={8} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary outline-none text-sm bg-gray-50 focus:bg-white transition-colors" />
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Confirmer le mot de passe</label>
                    <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" required minLength={8} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary outline-none text-sm bg-gray-50 focus:bg-white transition-colors" />
                </div>
                <button type="submit" disabled={loading} className="w-full gradient-primary text-white py-4 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:opacity-90 disabled:opacity-60 transition-all">
                    {loading ? (
                        <span className="flex items-center justify-center gap-2">
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Reinitialisation...
                        </span>
                    ) : "Reinitialiser le mot de passe"}
                </button>
            </form>
        </>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <div className="tricolor-bar w-full" />

            <header className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                    <Link href="/" className="text-lg font-extrabold text-primary">RDV<span className="text-accent">Priority</span><span className="text-gray-400 text-sm">.fr</span></Link>
                    <Link href="/login" className="text-sm font-bold text-primary hover:underline">Se connecter</Link>
                </div>
            </header>

            <main className="flex-1 flex items-center justify-center py-12 px-4">
                <div className="w-full max-w-md">
                    <div className="card-govt bg-white rounded-2xl p-8">
                        <div className="text-center mb-8">
                            <h1 className="text-2xl font-black text-gray-900">Nouveau mot de passe</h1>
                            <p className="text-sm text-gray-500 mt-2">Choisissez un nouveau mot de passe securise</p>
                        </div>
                        <Suspense fallback={<div className="text-center text-sm text-gray-400">Chargement...</div>}>
                            <ResetPasswordForm />
                        </Suspense>
                    </div>
                </div>
            </main>
        </div>
    );
}
