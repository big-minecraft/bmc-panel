import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLogin } from '../hooks/useLogin';
import { useAuthContext } from '../context/AuthContext';
import { Alert } from '../components/Alert';
import LoginForm from '../components/LoginForm';
import { ForgotPasswordModal } from '../components/ForgotPasswordModal';
import { checkAuthToken } from '../../../utils/auth';

const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { error } = useAuthContext();
    const loginProps = useLogin();

    useEffect(() => {
        if (checkAuthToken()) {
            const from = location.state?.from || '/';
            navigate(from, { replace: true });
        }
    }, [navigate, location]);

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-6">
                    <div className="card">
                        <div className="card-header">
                            <h4 className="card-title mb-0">Login</h4>
                            <small className="text-muted">
                                {loginProps.authStep === 1 && 'Enter your credentials'}
                                {loginProps.authStep === 2 && 'Enter verification code'}
                            </small>
                        </div>
                        <div className="card-body">
                            {error && <Alert message={error} />}
                            <LoginForm {...loginProps} />
                        </div>
                    </div>
                </div>
            </div>
            <ForgotPasswordModal
                show={loginProps.showForgotModal}
                onClose={() => loginProps.setShowForgotModal(false)}
            />
        </div>
    );
};

export default Login;