import React, { useEffect, useCallback, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useConfig } from '../hooks/useConfig.ts';
import ConfigEditor from '../components/editor/ConfigEditor';
import ConfigHeader from '../components/editor/ConfigHeader';
import { DeploymentsProvider } from '../context/DeploymentsContext';
import { CloseIcon } from '../icons/DeploymentIcons';

const ConfigEditContent = () => {
    const { name } = useParams();
    const location = useLocation();
    const navigate = useNavigate();
    const isProxy = location.pathname.startsWith('/proxy');

    const {
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
    } = useConfig(isProxy, name);

    const handleSave = async () => {
        if (isSaving) return;
        const success = await saveContent(content);
        if (success) {
            // Optional: navigate back after successful save
            // navigate('/deployments');
        }
    };

    const handleKeyDown = useCallback(async (event) => {
        if ((event.ctrlKey || event.metaKey) && event.key === 's') {
            event.preventDefault();
            await handleSave();
        }
    }, [handleSave]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);

    useEffect(() => {
        fetchContent();
    }, [isProxy, name]);

    if (isLoading) {
        return (
            <div className="fixed inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"/>
            </div>
        );
    }

    return (
        <div className="fixed inset-x-0 bottom-0 top-16 bg-gray-50">
            <div className="h-full flex flex-col">
                <div className="max-w-7xl w-full mx-auto flex-1 flex flex-col min-h-0">
                    <div className="p-6">
                        <ConfigHeader
                            title={isProxy ? 'Proxy Configuration' : name}
                            onBack={() => navigate('/deployments')}
                            onSave={handleSave}
                            isSaving={isSaving}
                        />

                        {error && (
                            <div className="mb-4 bg-red-50 text-red-600 px-4 py-3 rounded-lg flex justify-between items-center">
                                <span>{error}</span>
                                <button
                                    onClick={() => setError(null)}
                                    className="text-red-400 hover:text-red-500"
                                >
                                    <CloseIcon />
                                </button>
                            </div>
                        )}

                        {savedSuccessfully && (
                            <div className="mb-4 bg-green-50 text-green-600 px-4 py-3 rounded-lg flex justify-between items-center">
                                <span>Changes saved successfully!</span>
                                <button
                                    onClick={() => setSavedSuccessfully(false)}
                                    className="text-green-400 hover:text-green-500"
                                >
                                    <CloseIcon />
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex-1 px-6 pb-6 min-h-0">
                        <ConfigEditor
                            content={content}
                            onChange={setContent}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

const EditDeployments = () => {
    return (
        <DeploymentsProvider>
            <ConfigEditContent />
        </DeploymentsProvider>
    );
};

export default EditDeployments;