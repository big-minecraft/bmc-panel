import React, { useState } from 'react';
import axiosInstance, { setAuthToken } from '../utils/auth';

const LoginForm = () => {
    const [step, setStep] = useState(1);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [token, setToken] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await axiosInstance.post('/api/login', {
                username,
                password
            });

            localStorage.setItem('sessionToken', response.data.sessionToken);
            setStep(2);

        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyToken = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const sessionToken = localStorage.getItem('sessionToken');

            const response = await axiosInstance.post('/api/verify-login', {
                username,
                token,
                sessionToken
            });

            if (response.data.verified) {
                handleSuccessfulLogin(response.data);
            } else {
                setError('Invalid verification code');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Verification failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSuccessfulLogin = (data) => {
        setAuthToken(data.token);
        window.location.href = '/';
    };

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-6">
                    <div className="card">
                        <div className="card-header">
                            <h4 className="card-title mb-0">Login</h4>
                            <small className="text-muted">
                                {step === 1 && 'Enter your credentials'}
                                {step === 2 && 'Enter verification code'}
                            </small>
                        </div>
                        <div className="card-body">
                            {error && (
                                <div className="alert alert-danger d-flex align-items-center" role="alert">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-exclamation-triangle-fill flex-shrink-0 me-2" viewBox="0 0 16 16">
                                        <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
                                    </svg>
                                    <div>{error}</div>
                                </div>
                            )}

                            {step === 1 && (
                                <form onSubmit={handleLogin}>
                                    <div className="mb-3">
                                        <label className="form-label">Username</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            required
                                            autoFocus
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Password</label>
                                        <input
                                            type="password"
                                            className="form-control"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="d-grid gap-2">
                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                            disabled={loading}
                                        >
                                            {loading ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                    Logging in...
                                                </>
                                            ) : 'Log In'}
                                        </button>
                                        <a href="/register" className="btn btn-outline-secondary">
                                            Create Account
                                        </a>
                                    </div>
                                </form>
                            )}

                            {step === 2 && (
                                <form onSubmit={handleVerifyToken}>
                                    <div className="mb-4">
                                        <p className="text-center text-muted">
                                            Enter the code from your authenticator app
                                        </p>
                                    </div>
                                    <div className="mb-3">
                                        <input
                                            type="text"
                                            className="form-control form-control-lg text-center"
                                            placeholder="Enter 6-digit code"
                                            value={token}
                                            onChange={(e) => setToken(e.target.value)}
                                            maxLength={6}
                                            pattern="[0-9]*"
                                            inputMode="numeric"
                                            autoComplete="one-time-code"
                                            required
                                            autoFocus
                                        />
                                    </div>
                                    <div className="d-grid gap-2">
                                        <button
                                            type="submit"
                                            className="btn btn-primary"
                                            disabled={loading}
                                        >
                                            {loading ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                    Verifying...
                                                </>
                                            ) : 'Verify Code'}
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary"
                                            onClick={() => {
                                                setStep(1);
                                                setError('');
                                                setToken('');
                                            }}
                                        >
                                            Back to Login
                                        </button>
                                    </div>
                                </form>
                            )}

                            <div className="mt-3 text-center">
                                <a href="/forgot-password" className="text-decoration-none">
                                    Forgot your password?
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginForm;