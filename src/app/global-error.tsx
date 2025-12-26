'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

interface ErrorBoundaryProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorBoundaryProps) {
    useEffect(() => {
        // Log the error to Sentry
        Sentry.captureException(error);
    }, [error]);

    return (
        <html>
            <body>
                <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                    <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">😵</span>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            Something went wrong!
                        </h1>
                        <p className="text-gray-600 mb-6">
                            We apologize for the inconvenience. Our team has been notified.
                        </p>
                        <button
                            onClick={reset}
                            className="w-full py-3 px-4 bg-velvet-rose text-white font-semibold rounded-xl hover:bg-velvet-rose/90 transition-colors"
                        >
                            Try Again
                        </button>
                        <a
                            href="/"
                            className="block mt-3 text-sm text-gray-500 hover:text-velvet-rose transition-colors"
                        >
                            Go back home
                        </a>
                    </div>
                </div>
            </body>
        </html>
    );
}
