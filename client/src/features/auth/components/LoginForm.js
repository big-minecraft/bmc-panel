import React from 'react';
import { LoadingButton } from './LoadingButton';

const LoginForm = ({
                       username,
                       setUsername,
                       password,
                       setPassword,
                       token,
                       setToken,
                       authStep,
                       setAuthStep,
                       loading,
                       setShowForgotModal,
                       handleLogin,
                       handleVerifyToken
                   }) => {
    if (authStep === 1) {
        return (
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
                    <LoadingButton
                        loading={loading}
                        loadingText="Logging in..."
                        text="Log In"
                    />
                    <a href="/register" className="btn btn-outline-secondary">
                        Create Account
                    </a>
                </div>
                <div className="mt-3 text-center">
                    <button
                        type="button"
                        onClick={() => setShowForgotModal(true)}
                        className="btn btn-link text-decoration-none"
                    >
                        Forgot your password?
                    </button>
                </div>
            </form>
        );
    }

    if (authStep === 2) {
        return (
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
                    <LoadingButton
                        loading={loading}
                        loadingText="Verifying..."
                        text="Verify Code"
                    />
                    <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => {
                            setAuthStep(1);
                            setToken('');
                        }}
                    >
                        Back to Login
                    </button>
                </div>
            </form>
        );
    }

    return null;
};

export default LoginForm;