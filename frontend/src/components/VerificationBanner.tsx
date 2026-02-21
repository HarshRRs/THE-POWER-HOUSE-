"use client";

import { useState } from "react";
import api from "@/lib/api";

export default function VerificationBanner() {
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    const handleResend = async () => {
        setSending(true);
        try {
            await api.post("/auth/resend-verification");
            setSent(true);
        } catch {
            // Silently fail - don't block the UI
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
                <p className="text-xs font-semibold text-amber-800">
                    Votre email n&apos;est pas encore verifie. Verifiez votre boite de reception.
                </p>
                {sent ? (
                    <span className="text-xs font-bold text-green-600 whitespace-nowrap">Email envoye !</span>
                ) : (
                    <button
                        onClick={handleResend}
                        disabled={sending}
                        className="text-xs font-bold text-amber-700 hover:text-amber-900 underline whitespace-nowrap disabled:opacity-50"
                    >
                        {sending ? "Envoi..." : "Renvoyer"}
                    </button>
                )}
            </div>
        </div>
    );
}
