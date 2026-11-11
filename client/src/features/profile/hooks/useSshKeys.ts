import {useCallback, useState} from 'react';
import {AxiosError} from 'axios';
import apiClient from '../../../utils/auth';
import type {Profile, SshKey} from '../types/types';

const messageFor = (error: unknown, fallback: string): string => {
    const responseError = (error as AxiosError<{ error?: string }>)?.response?.data?.error;
    return responseError || fallback;
};

export const useProfile = () => {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [keys, setKeys] = useState<SshKey[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProfile = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const [profileResponse, keysResponse] = await Promise.all([
                apiClient.get<{ data: Profile }>('/api/profile'),
                apiClient.get<{ data: { keys: SshKey[] } }>('/api/profile/ssh-keys'),
            ]);

            setProfile(profileResponse.data.data);
            setKeys(keysResponse.data.data.keys);
        } catch (err) {
            setError(messageFor(err, 'Failed to load your profile'));
        } finally {
            setIsLoading(false);
        }
    }, []);

    const addKey = useCallback(async (name: string, publicKey: string): Promise<SshKey> => {
        try {
            const response = await apiClient.post<{ data: { key: SshKey } }>(
                '/api/profile/ssh-keys',
                {name, publicKey}
            );

            const key = response.data.data.key;
            setKeys(previous => [key, ...previous]);
            return key;
        } catch (err) {
            throw new Error(messageFor(err, 'Failed to add SSH key'));
        }
    }, []);

    const removeKey = useCallback(async (id: number): Promise<void> => {
        try {
            await apiClient.delete(`/api/profile/ssh-keys/${id}`);
            setKeys(previous => previous.filter(key => key.id !== id));
        } catch (err) {
            throw new Error(messageFor(err, 'Failed to remove SSH key'));
        }
    }, []);

    return {profile, keys, isLoading, error, fetchProfile, addKey, removeKey};
};
