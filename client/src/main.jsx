import React from 'react';
import ReactDOM from 'react-dom/client';
import axios from 'axios';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
// Temporarily commented out Materialize - may be interfering with form inputs
// import 'materialize-css/dist/css/materialize.min.css'
// import 'materialize-css/dist/js/materialize.min.js'
import './styles/variables.css';
import './styles/global.css';

// Configure axios to include credentials (cookies) with all requests
axios.defaults.withCredentials = true;


ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <AuthProvider>
            <App />
        </AuthProvider>
    </React.StrictMode>
);
