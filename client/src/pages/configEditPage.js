import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import 'bootstrap/dist/css/bootstrap.min.css';
import axiosInstance from "../utils/auth";

const ConfigEditPage = () => {
    const { name } = useParams();
    const location = useLocation();
    const isProxy = location.pathname.startsWith('/proxy');
    const navigate = useNavigate();

    const [content, setContent] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [savedSuccessfully, setSavedSuccessfully] = useState(false);

    const endpoint = isProxy ? '/api/proxy' : `/api/deployments/${name}`;
    const displayType = isProxy ? 'Proxy Configuration' : 'Game Configuration';

    useEffect(() => {
        fetchContent();
    }, [isProxy, name]);

    const fetchContent = async () => {
        try {
            setIsLoading(true);
            const response = await axiosInstance.get(endpoint);
            setContent(response.data.content);
            setError(null);
        } catch (err) {
            setError(`Failed to load ${displayType.toLowerCase()} content`);
            console.error(`Error fetching ${displayType.toLowerCase()} content:`, err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setIsSaving(true);
            await axiosInstance.put(endpoint, {
                content: content
            });
            setSavedSuccessfully(true);
        } catch (err) {
            setError(`Failed to save ${displayType.toLowerCase()} content`);
            console.error(`Error saving ${displayType.toLowerCase()} content:`, err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditorChange = (value) => {
        setContent(value);
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
            <style>
                {`
          .editor-container {
            border-radius: 10px;
            overflow: hidden;
            height: 80%;
            border: 1px solid gray;
          }
          .content-container {
            margin-top: 30px;
          }
          body, html {
            overflow: hidden;
          }
        `}
            </style>
            {/* Header */}
            <div className="row mb-3 content-container">
                <div className="col d-flex justify-content-between align-items-center">
                    <div>
                        <h1 className="h3 mb-0">
                            Editing: {isProxy ? 'Proxy Configuration' : name}
                        </h1>
                    </div>
                    <div className="d-flex gap-2">
                        <button
                            className="btn btn-secondary"
                            onClick={() => navigate('/deployments')}
                        >
                            Back
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={handleSave}
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Saving...
                                </>
                            ) : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Error Alert */}
            {error && (
                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                    {error}
                    <button
                        type="button"
                        className="btn-close"
                        onClick={() => setError(null)}
                        aria-label="Close"
                    ></button>
                </div>
            )}

            {/* Success Alert */}
            {savedSuccessfully && (
                <div className="alert alert-success alert-dismissible" role="alert">
                    Changes saved successfully!
                    <button
                        type="button"
                        className="btn-close"
                        onClick={() => setSavedSuccessfully(false)}
                        aria-label="Close"
                    ></button>
                </div>
            )}

            {/* Editor */}
            <div className="row flex-grow-1">
                <div className="col">
                    <div className="card-body p-0 editor-container">
                        <Editor
                            height="100%"
                            defaultLanguage="yaml"
                            theme="vs-light"
                            value={content}
                            onChange={handleEditorChange}
                            options={{
                                minimap: { enabled: false },
                                fontSize: 14,
                                wordWrap: 'on',
                                automaticLayout: true,
                                scrollBeyondLastLine: false,
                                lineNumbers: 'on',
                                tabSize: 2,
                                readOnly: false
                            }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfigEditPage;