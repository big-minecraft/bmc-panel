import {useState} from 'react';
import axiosInstance, {setAuthToken} from '../../../utils/auth';
import {useAuthContext} from '../context/AuthContext';

export const useRegistration = () => {
    const [inviteCode, setInviteCode] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [token, setToken] = useState('');
    const [qrCode, setQrCode] = useState('');
    const [inviteToken, setInviteToken] = useState('');
    const [success, setSuccess] = useState(false);

    const {
        error,
        setError,
        loading,
        setLoading,
        authStep,
        setAuthStep,
    } = useAuthContext();

    const verifyInvite = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await axiosInstance.post('/api/auth/verify-invite', {
                inviteCode
            });

            console.log(response.data.data);

            if (response.data.data.token) {
                setAuthStep(2);
                setInviteToken(response.data.data.token);
            } else {
                setError('invalid invite code please try again');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'failed to verify invite code please try again');
        } finally {
            setLoading(false);
        }
    };

    const submitCredentials = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await axiosInstance.post('/api/auth/register', {
                username,
                password,
                inviteToken
            });

            setQrCode(response.data.data.qrCode);
            setAuthStep(3);
        } catch (err) {
            setError(err.response?.data?.error || 'registration failed please try again');
        } finally {
            setLoading(false);
        }
    };

    const verifyToken = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await axiosInstance.post('/api/auth/verify-registration', {
                username,
                token,
                inviteToken
            });

            if (response.data.data.loginToken) {
                setSuccess(true);
                setAuthStep(4);
                setAuthToken(response.data.data.loginToken, response.data.data.isAdmin === 1 ? 'true' : 'false');
                window.location.href = '/';
            }
        } catch (err) {
            setError(err.response?.data?.error || err.message || 'verification failed please try again');
        } finally {
            setLoading(false);
        }
    };

    return {
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
    };
};