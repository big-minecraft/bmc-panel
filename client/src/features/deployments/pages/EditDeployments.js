import React, { useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useConfig } from '../hooks/useConfig';
import ConfigEditor from '../components/editor/ConfigEditor';
import ConfigHeader from '../components/editor/ConfigHeader';
import { DeploymentsProvider } from '../context/DeploymentsContext';

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

    useEffect(() => {
        fetchContent();
    }, [isProxy, name]);

    const handleSave = async () => {
        const success = await saveContent(content);
        if (success) {
            // Optional: navigate back after successful save
            // navigate('/deployments');
        }
    };

    if (isLoading) {
        return (
            <div className="min-vh-100 d-flex align-items-center justify-content-center">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid vh-100 d-flex flex-column p-3">
            <style>{`
        body, html {
          overflow: hidden;
        }
      `}</style>

            <ConfigHeader
                title={isProxy ? 'Proxy Configuration' : name}
                onBack={() => navigate('/deployments')}
                onSave={handleSave}
                isSaving={isSaving}
            />

            {error && (
                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                    {error}
                    <button
                        type="button"
                        className="btn-close"
                        onClick={() => setError(null)}
                        aria-label="Close"
                    />
                </div>
            )}

            {savedSuccessfully && (
                <div className="alert alert-success alert-dismissible" role="alert">
                    Changes saved successfully!
                    <button
                        type="button"
                        className="btn-close"
                        onClick={() => setSavedSuccessfully(false)}
                        aria-label="Close"
                    />
                </div>
            )}

            <div className="row flex-grow-1">
                <div className="col">
                    <ConfigEditor
                        content={content}
                        onChange={setContent}
                    />
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