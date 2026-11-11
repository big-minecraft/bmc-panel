import {useEffect, useState} from 'react';
import {motion} from 'framer-motion';
import {setAuthToken} from '../../../utils/auth';
import AuthLayout from '../components/AuthLayout';
import {Alert} from '../components/Alert';

const OidcCallback = () => {
    const [error, setError] = useState('');

    useEffect(() => {
        const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
        const token = params.get('token');
        const isAdmin = params.get('isAdmin') === 'true';
        const returnTo = params.get('returnTo') || '/';

        if (!token) {
            setError('No sign-in token was returned. Please try again.');
            return;
        }

        setAuthToken(token, isAdmin ? 'true' : 'false');
        window.location.replace(returnTo.startsWith('/') ? returnTo : '/');
    }, []);

    if (!error) {
        return (
            <AuthLayout title="Signing you in" subtitle="Completing single sign-on">
                <div className="w-full max-w-md mx-auto flex justify-center py-8">
                    <motion.div
                        className="h-8 w-8 rounded-full border-2 border-indigo-500 border-t-transparent"
                        animate={{rotate: 360}}
                        transition={{duration: 0.8, repeat: Infinity, ease: 'linear'}}
                    />
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout title="Sign-in failed" subtitle="Single sign-on could not be completed">
            <div className="w-full max-w-md mx-auto space-y-6">
                <Alert message={error}/>
                <a
                    href="/login"
                    className="flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-gray-700
                               bg-gray-50 border border-gray-300 rounded-lg hover:bg-gray-100
                               transition-colors duration-200"
                >
                    Back to Login
                </a>
            </div>
        </AuthLayout>
    );
};

export default OidcCallback;
