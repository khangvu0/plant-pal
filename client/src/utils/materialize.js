// Materialize initialization utilities
import M from 'materialize-css';

// Initialize all Materialize components on page load
export const initMaterialize = () => {
    // Auto-initialize all components
    M.AutoInit();
    
    // Or initialize specific components:
    // const dropdowns = document.querySelectorAll('.dropdown-trigger');
    // M.Dropdown.init(dropdowns);
    
    // const modals = document.querySelectorAll('.modal');
    // M.Modal.init(modals);
    
    // const parallax = document.querySelectorAll('.parallax');
    // M.Parallax.init(parallax);
};

// Initialize specific components as needed
export const initDropdowns = () => {
    const dropdowns = document.querySelectorAll('.dropdown-trigger');
    return M.Dropdown.init(dropdowns);
};

export const initModals = () => {
    const modals = document.querySelectorAll('.modal');
    return M.Modal.init(modals);
};

export const initTooltips = () => {
    const tooltips = document.querySelectorAll('.tooltipped');
    return M.Tooltip.init(tooltips);
};

export const showToast = (message, classes = 'green') => {
    M.toast({ html: message, classes });
};
