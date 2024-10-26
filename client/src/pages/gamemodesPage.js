import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import {useNavigate} from "react-router-dom";
import axiosInstance from "../utils/auth";

const GamemodesPage = () => {
    const navigate = useNavigate();
    const [gamemodes, setGamemodes] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newGamemodeName, setNewGamemodeName] = useState('');
    const [gamemodeToDelete, setGamemodeToDelete] = useState(null);

    useEffect(() => {
        fetchGamemodes();
    }, []);

    const fetchGamemodes = async () => {
        try {
            setIsLoading(true);
            const response = await axiosInstance.get('/api/gamemodes');
            setGamemodes(response.data);
            setError(null);
        } catch (err) {
            setError('Failed to load gamemodes');
            console.error('Error fetching gamemodes:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggle = async (gamemodeName, currentState) => {
        try {
            await axiosInstance.patch(`/api/gamemodes/${gamemodeName}`, {
                enabled: !currentState
            });

            setGamemodes(prevGamemodes =>
                prevGamemodes.map(gamemode =>
                    gamemode.name === gamemodeName
                        ? { ...gamemode, enabled: !currentState }
                        : gamemode
                )
            );
        } catch (err) {
            console.error('Error toggling gamemode:', err);
        }
    };

    const handleEdit = (gamemodeName) => {
        navigate(`/gamemodes/${gamemodeName}/edit`);
    };

    const handleCreate = async () => {
        if (!newGamemodeName.trim()) return;

        try {
            await axiosInstance.post('/api/gamemodes', {
                name: newGamemodeName
            });

            setShowCreateModal(false);
            setNewGamemodeName('');
            await fetchGamemodes();
        } catch (err) {
            console.error('Error creating gamemode:', err);
            // You might want to show an error message to the user here
        }
    };

    const handleDelete = async () => {
        if (!gamemodeToDelete) return;

        try {
            await axiosInstance.delete(`/api/gamemodes/${gamemodeToDelete}`);
            setGamemodeToDelete(null);
            await fetchGamemodes();
        } catch (err) {
            console.error('Error deleting gamemode:', err);
            // You might want to show an error message to the user here
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

    if (error) {
        return (
            <div className="min-vh-100 d-flex align-items-center justify-content-center">
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="container py-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h1 className="display-6 mb-0">Gamemode Management</h1>
                <button
                    className="btn btn-primary"
                    onClick={() => setShowCreateModal(true)}
                >
                    Create Gamemode
                </button>
            </div>

            <div className="row g-4">
                {gamemodes.map((gamemode) => (
                    <div key={gamemode.name} className="col-12">
                        <div className="card">
                            <div className="card-body d-flex justify-content-between align-items-center">
                                <div>
                                    <h5 className="card-title mb-1">{gamemode.name}</h5>
                                    <p className="card-text text-muted small mb-0">
                                        {gamemode.path}
                                    </p>
                                </div>

                                <div className="d-flex align-items-center gap-3">
                                    <button
                                        className="btn btn-outline-primary btn-sm"
                                        onClick={() => handleEdit(gamemode.name)}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-pencil" viewBox="0 0 16 16">
                                            <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/>
                                        </svg>
                                    </button>

                                    <button
                                        className="btn btn-outline-danger btn-sm"
                                        onClick={() => setGamemodeToDelete(gamemode.name)}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-trash" viewBox="0 0 16 16">
                                            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
                                            <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/>
                                        </svg>
                                    </button>

                                    <div className="form-check form-switch">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            id={`gamemode-toggle-${gamemode.name}`}
                                            checked={gamemode.enabled}
                                            onChange={() => handleToggle(gamemode.name, gamemode.enabled)}
                                        />
                                        <label
                                            className="form-check-label"
                                            htmlFor={`gamemode-toggle-${gamemode.name}`}
                                        >
                                            {gamemode.enabled ? 'Enabled' : 'Disabled'}
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="modal d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Create New Gamemode</h5>
                                <button type="button" className="btn-close" onClick={() => setShowCreateModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Enter gamemode name"
                                    value={newGamemodeName}
                                    onChange={(e) => setNewGamemodeName(e.target.value)}
                                />
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                                <button type="button" className="btn btn-primary" onClick={handleCreate}>Create</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {gamemodeToDelete && (
                <div className="modal d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Confirm Delete</h5>
                                <button type="button" className="btn-close" onClick={() => setGamemodeToDelete(null)}></button>
                            </div>
                            <div className="modal-body">
                                Are you sure you want to delete the gamemode "{gamemodeToDelete}"?
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setGamemodeToDelete(null)}>Cancel</button>
                                <button type="button" className="btn btn-danger" onClick={handleDelete}>Delete</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default GamemodesPage;