import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Header.css';

export default function Header() {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Toggle dropdown visibility
    const handleToggle = (e) => {
        e.preventDefault();
        setIsDropdownOpen((prev) => !prev);
    };

    // Close dropdown if user clicks outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target)
            ) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    // Close dropdown when a link inside it is clicked
    const handleLinkClick = () => {
        setIsDropdownOpen(false);
    };

    return (
        <header className="header" id="header">
            <nav className="nav">
                <Link to="/" className="nav_logo">
                    PlantPal
                </Link>

                <div className="nav_menu" id="nav-menu">
                    <ul className="nav_list">
                        <li className="nav_item dropdown" ref={dropdownRef}>
                            <p className="nav_icon" onClick={handleToggle}>
                                ≡
                            </p>

                            <ul
                                className={`dropdown_menu ${
                                    isDropdownOpen ? 'show' : ''
                                }`}>
                                <li className="browser-default">
                                    <Link
                                        to="/"
                                        className="dropdown_item"
                                        onClick={handleLinkClick}>
                                        Home
                                    </Link>
                                </li>
                                <li className="browser-default">
                                    <Link
                                        to="/dashboard"
                                        className="dropdown_item"
                                        onClick={handleLinkClick}>
                                        Dashboard
                                    </Link>
                                </li>
                                <li className="browser-default">
                                    <Link
                                        to="/register"
                                        className="dropdown_item"
                                        onClick={handleLinkClick}>
                                        Register
                                    </Link>
                                </li>
                                <li className="browser-default">
                                    <Link
                                        to="/login"
                                        className="dropdown_item"
                                        onClick={handleLinkClick}>
                                        Login
                                    </Link>
                                </li>
                            </ul>
                        </li>
                    </ul>
                </div>
            </nav>
        </header>
    );
}
