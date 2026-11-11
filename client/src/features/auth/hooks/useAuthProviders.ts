import {useEffect, useState} from 'react';
import axios from 'axios';

export interface AuthProviders {
    localLogin: boolean;
    oidc: {
        enabled: boolean;
        displayName: string;
    };
}

const FALLBACK: AuthProviders = {
    localLogin: true,
    oidc: {enabled: false, displayName: 'Single Sign-On'},
};

export const useAuthProviders = () => {
    const [providers, setProviders] = useState<AuthProviders>(FALLBACK);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                const response = await axios.get('/api/auth/providers');
                if (!cancelled && response.data?.success) setProviders(response.data.data);
            } catch (error) {
                console.error('failed to load auth providers:', error);
            } finally {
                if (!cancelled) setLoaded(true);
            }
        };

        load();
        return () => {
            cancelled = true;
        };
    }, []);

    return {providers, loaded};
};