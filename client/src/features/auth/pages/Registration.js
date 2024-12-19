import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useRegistration } from '../hooks/useRegistration.js';
import { useAuthContext } from '../context/AuthContext.js';
import { Alert } from '../components/Alert.js';
import RegistrationForm from '../components/RegistrationForm.js';
import AuthLayout from '../components/AuthLayout.js';
import { checkAuthToken } from '../../../utils/auth';

const Registration = () => {
    const navigate = useNavigate();
    const { error, authStep } = useAuthContext();
    const registrationProps = useRegistration();

    useEffect(() => {
        if (checkAuthToken()) {
            navigate('/', { replace: true });
        }
    }, [navigate]);

    const getTitle = () => {
        if (authStep === 4) return 'Registration Complete';
        return 'Create Account';
    };

    const getSubtitle = () => {
        switch (authStep) {
            case 1:
                return 'Enter your invite code';
            case 2:
                return 'Choose your credentials';
            case 3:
                return 'Set up two-factor authentication';
            case 4:
                return 'You can now log in to your account';
            default:
                return '';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50"
        >
            <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />

            <AuthLayout
                title={getTitle()}
                subtitle={getSubtitle()}
            >
                <div className="w-full max-w-md mx-auto">
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <Alert message={error} />
                        </motion.div>
                    )}

                    <motion.div
                        initial={false}
                        animate={{ height: 'auto' }}
                        transition={{ duration: 0.3 }}
                    >
                        <RegistrationForm {...registrationProps} />
                    </motion.div>

                    {authStep !== 4 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                            className="mt-6 text-center"
                        >
                            <p className="text-sm text-gray-600">
                                Already have an account?{' '}
                                <motion.a
                                    href="/login"
                                    className="text-indigo-600 hover:text-indigo-500 font-medium"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    Sign in
                                </motion.a>
                            </p>
                        </motion.div>
                    )}
                </div>
            </AuthLayout>

            <motion.div
                className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-center text-sm text-gray-500"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
            >
                <p>By creating an account, you agree to our terms of service and privacy policy</p>
            </motion.div>
        </motion.div>
    );
};

export default Registration;