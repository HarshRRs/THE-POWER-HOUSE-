export default function TrustBadges() {
    return (
        <div className="flex flex-col items-center gap-3 mt-6 animate-fade-in">
            <div className="flex items-center gap-2 grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-300">
                {/* Visa */}
                <svg className="h-8" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="48" height="32" rx="4" fill="white" stroke="#E5E7EB" />
                    <path d="M19.7 7.7H16.4L14.4 20H17.6L19.7 7.7ZM31.1 14C31.1 12 29.5 11 28.5 11C27.5 11 26.5 11.5 26.5 11.5L26.1 9C26.1 9 27.2 8.4 29 8.4C31.5 8.4 33.7 9.8 33.7 12.8C33.7 15.6 30.6 15.9 30.6 17.5C30.6 18.2 31.4 18.5 32 18.5C33.6 18.5 34.6 18 34.6 18L35.2 20.8C35.2 20.8 33.6 21.6 31.2 21.6C28.4 21.6 26.4 20 26.4 16.7C26.4 14.3 31.1 13.9 31.1 14ZM38 21.4H40.7L38.4 7.7H35.8C35.2 7.7 34.9 8.2 34.7 8.7L30 21.4H33.3L34 19.3H38.2L38 21.4ZM35 16.6L36.7 11.3L37.2 16.6H35ZM12.7 7.7H9.2C9 7.7 8.8 7.8 8.8 8.1L6.1 15C5.8 13.7 5.8 13.7 5.6 12.5C5.4 11.7 5.4 11.7 5.2 10.9L4.4 7.7H1L3.9 19.9L5.4 19.9L12.7 7.7Z" fill="#1A1F70" />
                </svg>
                {/* Mastercard */}
                <svg className="h-8" viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="48" height="32" rx="4" fill="white" stroke="#E5E7EB" />
                    <circle cx="18" cy="16" r="7" fill="#EB001B" />
                    <circle cx="30" cy="16" r="7" fill="#F79E1B" />
                    <path d="M24 20.6C22.2 19.5 21 17.9 21 16C21 14.1 22.2 12.5 24 11.4C25.8 12.5 27 14.1 27 16C27 17.9 25.8 19.5 24 20.6Z" fill="#FF5F00" />
                </svg>
                {/* Stripe */}
                <div className="bg-white border border-gray-200 px-2 h-8 rounded flex items-center">
                    <span className="text-xs font-bold text-gray-500 font-sans tracking-tight">Stripe</span>
                </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500">
                <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Paiement 100% sécurisé via SSL 256 bits</span>
            </div>
            <p className="text-[10px] text-gray-400 text-center">
                Satisfait ou remboursé sous 30 jours • Annulation en 1 clic
            </p>
        </div>
    );
}
