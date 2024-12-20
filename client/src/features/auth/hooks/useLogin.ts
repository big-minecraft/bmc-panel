import { useState } from 'react';
import axiosInstance, { setAuthToken } from '../../../utils/auth';
import { useAuthContext } from '../context/AuthContext';

export const useLogin = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [token, setToken] = useState('');
    const [showForgotModal, setShowForgotModal] = useState(false);

    const {
        error,
        setError,
        loading,
        setLoading,
        authStep,
        setAuthStep,
        setSessionToken
    } = useAuthContext();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await axiosInstance.post('/api/login', {
                username,
                password
            });

            setSessionToken(response.data.sessionToken);
            localStorage.setItem('sessionToken', response.data.sessionToken);
            setAuthStep(2);
        } catch (err) {
            setError(err.response?.data?.message || 'login failed please check your credentials');
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
                setAuthToken(response.data.token, response.data.isAdmin === 1 ? 'true' : 'false');
                window.location.href = '/';
            } else {
                setError('invalid verification code');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'verification failed please try again');
        } finally {
            setLoading(false);
        }
    };

    return {
        username,
        setUsername,
        password,
        setPassword,
        token,
        setToken,
        showForgotModal,
        setShowForgotModal,
        authStep,
        setAuthStep,
        loading,
        handleLogin,
        handleVerifyToken
    };
};