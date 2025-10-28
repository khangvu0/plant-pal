import React from 'react';
import '../styles/variables.css';
import '../styles/Button.css';

export default function Button({
    children,
    onClick,
    type = 'button',
    disabled = false,
    className = '',
    size = 'small',
}) {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`btn btn--${size} ${className}`.trim()}>
            {children}
        </button>
    );
}
