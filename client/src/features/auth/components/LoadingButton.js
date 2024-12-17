import React from 'react';

export const LoadingButton = ({ loading, loadingText, text }) => (
    <button
        type="submit"
        className="btn btn-primary w-100"
        disabled={loading}
    >
        {loading ? (
            <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                {loadingText}
            </>
        ) : text}
    </button>
);