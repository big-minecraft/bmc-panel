import {useState} from 'react';
import axiosInstance from '../../../utils/auth';

export const useConfig = (name) => {
    const [content, setContent] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [savedSuccessfully, setSavedSuccessfully] = useState(false);
    const displayType = 'Deployment Configuration';

    const fetchContent = async () => {
        try {
            setIsLoading(true);
            const response = await axiosInstance.get(`/api/deployments/${name}`);
            setContent(response.data.data.content);
            setError(null);
        } catch (err) {
            setError(`Failed to load ${displayType.toLowerCase()} content`);
            console.error(`error fetching ${displayType.toLowerCase()} content:`, err);
        } finally {
            setIsLoading(false);
        }
    };

    const saveContent = async (newContent) => {
        try {
            setIsSaving(true);
            await axiosInstance.patch(`/api/deployments/${name}`, {
                content: newContent
            });
            setSavedSuccessfully(true);
            return true;
        } catch (err) {
            setError(`Failed to save ${displayType.toLowerCase()} content`);
            console.error(`error saving ${displayType.toLowerCase()} content:`, err);
            return false;
        } finally {
            setIsSaving(false);
        }
    };

    return {
        content,
        setContent,
        isLoading,
        error,
        setError,
        isSaving,
        savedSuccessfully,
        setSavedSuccessfully,
        fetchContent,
        saveContent
    };
};