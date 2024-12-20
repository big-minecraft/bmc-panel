import './index.css';
import React from 'react';
import App from './App';
import {createRoot} from "react-dom/client";

const container = document.getElementById('root');
if (container === null) throw new Error('Root element not found');
const root = createRoot(container);
root.render(<App />);