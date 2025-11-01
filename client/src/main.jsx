import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// Temporarily commented out Materialize - may be interfering with form inputs
// import 'materialize-css/dist/css/materialize.min.css'
// import 'materialize-css/dist/js/materialize.min.js'
import './styles/variables.css';
import './styles/global.css';


ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
