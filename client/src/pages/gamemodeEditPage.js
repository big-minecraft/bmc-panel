import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import 'bootstrap/dist/css/bootstrap.min.css';
import axiosInstance from "../utils/auth";

const GamemodeEditPage = () => {
  const { gamemodeName } = useParams();
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccessfully, setSavedSuccessfully] = useState(false);

  useEffect(() => {
    fetchGamemodeContent();
  }, [gamemodeName]);

  const fetchGamemodeContent = async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.get(`/api/gamemodes/${gamemodeName}`);
      setContent(response.data.content);
      setError(null);
    } catch (err) {
      setError('Failed to load gamemode content');
      console.error('Error fetching gamemode content:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await axiosInstance.put(`/api/gamemodes/${gamemodeName}`, {
        content: content
      });
      setSavedSuccessfully(true);
    } catch (err) {
      setError('Failed to save gamemode content');
      console.error('Error saving gamemode content:', err);
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
            border-radius: 10px; /* Round the corners */
            overflow: hidden; /* Ensure rounded corners are visible */
            height: 80%; /* Adjust height to make it smaller */
            border: 1px solid gray; /* Add black border */
          }
          .content-container {
            margin-top: 30px; /* Push the div down */
          }
          body, html {
            overflow: hidden; /* Prevent scrolling */
          }
        `}
        </style>
        {/* Header */}
        <div className="row mb-3 content-container">
          <div className="col d-flex justify-content-between align-items-center">
            <div>
              <h1 className="h3 mb-0">Editing: {gamemodeName}</h1>
            </div>
            <div className="d-flex gap-2">
              <button
                  className="btn btn-secondary"
                  onClick={() => navigate('/gamemodes')}
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
            <div className="card-body p-0 editor-container"> {/* Apply custom CSS class */}
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

export default GamemodeEditPage;