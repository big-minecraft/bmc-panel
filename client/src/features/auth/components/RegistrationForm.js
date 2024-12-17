import React from 'react';
import { LoadingButton } from './LoadingButton';
import { CheckCircleIcon } from '../icons/AuthIcons';
import { useAuthContext } from '../context/AuthContext';

const RegistrationForm = ({
                              inviteCode,
                              setInviteCode,
                              username,
                              setUsername,
                              password,
                              setPassword,
                              token,
                              setToken,
                              qrCode,
                              success,
                              verifyInvite,
                              submitCredentials,
                              verifyToken
                          }) => {
    const { authStep, loading } = useAuthContext();

    if (authStep === 1) {
        return (
            <form onSubmit={verifyInvite}>
                <div className="mb-3">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Enter invite code"
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value)}
                        required
                    />
                </div>
                <LoadingButton
                    loading={loading}
                    loadingText="Verifying Code..."
                    text="Verify Invite Code"
                />
            </form>
        );
    }

    if (authStep === 2) {
        return (
            <form onSubmit={submitCredentials}>
                <div className="mb-3">
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>
                <div className="mb-3">
                    <input
                        type="password"
                        className="form-control"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <LoadingButton
                    loading={loading}
                    loadingText="Creating Account..."
                    text="Create Account"
                />
            </form>
        );
    }

    if (authStep === 3) {
        return (
            <form onSubmit={verifyToken}>
                <div className="text-center mb-4">
                    <img src={qrCode} alt="QR Code" className="img-fluid" style={{ maxWidth: '200px' }} />
                    <p className="mt-3 text-muted">
                        Scan this QR code with your authenticator app and enter the code below
                    </p>
                </div>
                <div className="mb-3">
                    <input
                        type="text"
                        className="form-control text-center"
                        placeholder="Enter 6-digit code"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        maxLength={6}
                        pattern="[0-9]*"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        required
                    />
                </div>
                <LoadingButton
                    loading={loading}
                    loadingText="Verifying..."
                    text="Verify Code"
                />
            </form>
        );
    }

    if (authStep === 4) {
        return (
            <div className="alert alert-success d-flex align-items-center" role="alert">
                <CheckCircleIcon />
                <div>
                    <h5 className="alert-heading">Success!</h5>
                    Your account has been created successfully. You can now login with your credentials.
                </div>
            </div>
        );
    }

    return null;
};

export default RegistrationForm;