import {useEffect} from 'react';
import {useNavigate, useLocation} from 'react-router-dom';
import {motion} from 'framer-motion';
import {useLogin} from '../hooks/useLogin';
import {useAuthContext} from '../context/AuthContext';
import {Alert} from '../components/Alert';
import LoginForm from '../components/LoginForm';
import {ForgotPasswordModal} from '../components/ForgotPasswordModal';
import {checkAuthToken} from '../../../utils/auth';
import AuthLayout from '../components/AuthLayout';
import {useAuthProviders} from '../hooks/useAuthProviders';

const OIDC_ERRORS = {
    oidc_disabled: 'Single sign-on is not enabled for this panel.',
    oidc_unavailable: 'Could not reach the identity provider. Please try again or use a password.',
    oidc_denied: 'The identity provider declined the sign-in request.',
    oidc_not_authorized: 'Your account is not a member of the group required to use this panel.',
    oidc_no_account: 'No panel account exists for your user. Ask an administrator to create one.',
    oidc_username_taken: 'Your username is already linked to a different identity.',
    oidc_failed: 'Single sign-on failed. Please try again.',
};

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const {error, setError} = useAuthContext();
    const loginProps = useLogin();
    const {providers, loaded} = useAuthProviders();

    const returnTo = location.state?.from || '/';

    useEffect(() => {
        if (checkAuthToken()) {
            const from = location.state?.from?.pathname || '/';
            navigate(from, {replace: true});
        }
    }, [navigate, location]);

    useEffect(() => {
        const code = new URLSearchParams(location.search).get('error');
        if (code) setError(OIDC_ERRORS[code] || OIDC_ERRORS.oidc_failed);
    }, [location.search, setError]);

    const getSubtitle = () => {
        if (loginProps.authStep === 1) {
            return providers.localLogin ? 'Enter your credentials' : 'Sign in to continue';
        }
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
                        {!loaded ? (
                            <div className="flex justify-center py-8">
                                <motion.div
                                    className="h-8 w-8 rounded-full border-2 border-indigo-500 border-t-transparent"
                                    animate={{rotate: 360}}
                                    transition={{duration: 0.8, repeat: Infinity, ease: 'linear'}}
                                />
                            </div>
                        ) : (
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
                            providers={providers}
                            returnTo={returnTo}
                        />
                        )}
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