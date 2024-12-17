import React from 'react';
import { useRegistration } from '../hooks/useRegistration';
import { useAuthContext } from '../context/AuthContext';
import { Alert } from '../components/Alert';
import RegistrationForm from '../components/RegistrationForm';

const Registration = () => {
    const { error, authStep } = useAuthContext();
    const registrationProps = useRegistration();

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-6">
                    <div className="card">
                        <div className="card-header">
                            <h4 className="card-title mb-0">Create Account</h4>
                            <small className="text-muted">
                                {authStep === 1 && 'Enter your invite code'}
                                {authStep === 2 && 'Enter your credentials'}
                                {authStep === 3 && 'Scan QR code and verify'}
                                {authStep === 4 && 'Registration complete!'}
                            </small>
                        </div>
                        <div className="card-body">
                            {error && <Alert message={error} />}
                            <RegistrationForm {...registrationProps} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Registration;