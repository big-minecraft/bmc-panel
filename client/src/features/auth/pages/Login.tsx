import React, {useEffect} from 'react';
import {useNavigate, useLocation} from 'react-router-dom';
import {motion} from 'framer-motion';
import {useLogin} from '../hooks/useLogin';
import {useAuthContext} from '../context/AuthContext';
import {Alert} from '../components/Alert';
import LoginForm from '../components/LoginForm';
import {ForgotPasswordModal} from '../components/ForgotPasswordModal';
import {checkAuthToken} from '../../../utils/auth';
import AuthLayout from '../components/AuthLayout';

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const {error} = useAuthContext();
    const loginProps = useLogin();

    useEffect(() => {
        if (checkAuthToken()) {
            const from = location.state?.from?.pathname || '/';
            navigate(from, {replace: true});
        }
    }, [navigate, location]);

    const getSubtitle = () => {
        if (loginProps.authStep === 1) return 'Enter your credentials';
        if (loginProps.authStep === 2) return 'Enter verification code';
        return '';
    };

    return (
        <motion.div
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
            className="fixed inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50"
        >
            <div
                className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10"/>

            <div className="h-full flex flex-col">
                <AuthLayout
                    title="Welcome Back"
                    subtitle={getSubtitle()}
                >
                    <div className="w-full max-w-md mx-auto">
                        {error && (
                            <motion.div
                                initial={{opacity: 0, y: -20}}
                                animate={{opacity: 1, y: 0}}
                                transition={{duration: 0.3}}
                            >
                                <Alert message={error}/>
                            </motion.div>
                        )}
                        <LoginForm
                            username={loginProps.username}
                            setUsername={loginProps.setUsername}
                            password={loginProps.password}
                            setPassword={loginProps.setPassword}
                            token={loginProps.token}
                            setToken={loginProps.setToken}
                            authStep={loginProps.authStep}
                            setAuthStep={loginProps.setAuthStep}
                            loading={loginProps.loading}
                            setShowForgotModal={loginProps.setShowForgotModal}
                            handleLogin={loginProps.handleLogin}
                            handleVerifyToken={loginProps.handleVerifyToken}
                        />
                    </div>
                </AuthLayout>

                <div className="mt-auto pb-4 text-center">
                    <motion.p
                        className="text-sm text-gray-500"
                        initial={{opacity: 0, y: 20}}
                        animate={{opacity: 1, y: 0}}
                        transition={{delay: 0.5}}
                    >
                        Need help? Contact your system administrator
                    </motion.p>
                </div>
            </div>

            <ForgotPasswordModal
                show={loginProps.showForgotModal}
                onClose={() => loginProps.setShowForgotModal(false)}
            />
        </motion.div>
    );
};

export default Login;