"use client";

import Link from "next/link";
import { useState } from "react";
import api, { getErrorMessage } from "@/lib/api";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            await api.post("/auth/forgot-password", { email });
            setSent(true);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

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
                            <h1 className="text-2xl font-black text-gray-900">Mot de passe oublie</h1>
                            <p className="text-sm text-gray-500 mt-2">Entrez votre email pour recevoir un lien de reinitialisation</p>
                        </div>

                        {sent ? (
                            <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl p-4 text-sm">
                                <p className="font-bold mb-1">Email envoye !</p>
                                <p>Si un compte existe avec cet email, vous recevrez un lien de reinitialisation.</p>
                                <Link href="/login" className="mt-4 inline-block text-primary font-bold hover:underline">
                                    Retour a la connexion
                                </Link>
                            </div>
                        ) : (
                            <>
                                {error && (
                                    <div className="mb-4 bg-accent-light border border-accent/20 text-accent rounded-xl p-3 text-sm font-semibold animate-fade-in">
                                        {error}
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="votre@email.fr" required className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-primary outline-none text-sm bg-gray-50 focus:bg-white transition-colors" />
                                    </div>
                                    <button type="submit" disabled={loading} className="w-full gradient-primary text-white py-4 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:opacity-90 disabled:opacity-60 transition-all">
                                        {loading ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Envoi...
                                            </span>
                                        ) : "Envoyer le lien de reinitialisation"}
                                    </button>
                                </form>

                                <div className="mt-6 pt-6 border-t border-gray-100 text-center">
                                    <Link href="/login" className="text-sm text-primary font-bold hover:underline">Retour a la connexion</Link>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
