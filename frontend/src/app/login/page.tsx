"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth, getErrorMessage } from "@/context/auth";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [pass, setPass] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const { login } = useAuth();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            await login(email, pass);
            router.push("/dashboard");
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
                <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between">
                    <Link href="/" className="text-lg font-extrabold text-primary">RDV<span className="text-accent">Priority</span><span className="text-gray-400 text-sm">.fr</span></Link>
                    <Link href="/register" className="gradient-urgent text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:opacity-90 flex items-center gap-1.5 btn-press">
                        🚨 S&apos;inscrire
                    </Link>
                </div>
            </header>

            <main className="flex-1 flex items-center justify-center py-6 px-4 sm:py-12">
                <div className="w-full max-w-md">
                    <div className="card-govt bg-white rounded-2xl p-5 sm:p-8">
                        <div className="text-center mb-6 sm:mb-8">
                            <h1 className="text-2xl font-black text-gray-900">Connexion</h1>
                            <p className="text-sm text-gray-500 mt-2">Accédez à votre tableau de surveillance</p>
                        </div>

                        {error && (
                            <div className="mb-4 bg-accent-light border border-accent/20 text-accent rounded-xl p-3 text-sm font-semibold animate-fade-in">
                                ❌ {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Email</label>
                                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="votre@email.fr" required className="w-full input-mobile" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Mot de passe</label>
                                <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="••••••••" required className="w-full input-mobile" />
                            </div>
                            <button type="submit" disabled={loading} className="w-full gradient-primary text-white py-4 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:opacity-90 disabled:opacity-60 transition-all btn-press">
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Connexion...
                                    </span>
                                ) : "Se connecter"}
                            </button>
                        </form>

                        <div className="mt-6 pt-6 border-t border-gray-100 text-center space-y-2">
                            <p className="text-sm text-gray-500">
                                Pas encore de compte ?{" "}
                                <Link href="/register" className="text-accent font-bold hover:underline">Activer la surveillance →</Link>
                            </p>
                            <p>
                                <Link href="/forgot-password" className="text-sm text-primary font-semibold hover:underline">Mot de passe oublie ?</Link>
                            </p>
                        </div>
                    </div>

                    <div className="mt-4 bg-accent-light rounded-xl p-4 text-center">
                        <p className="text-xs text-gray-600">
                            <span className="font-bold text-accent">⚠️ En ce moment :</span> 74% des créneaux sont pris en moins de 2 minutes
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
