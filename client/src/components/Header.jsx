import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Header.css';

export default function Header() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
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

    const handleLogout = async () => {
        await logout();
        navigate('/');
        handleLinkClick();
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
                                {user ? (
                                    <>
                                        <li className="browser-default">
                                            <Link
                                                to="/dashboard"
                                                className="dropdown_item"
                                                onClick={handleLinkClick}>
                                                Dashboard
                                            </Link>
                                        </li>
                                        <li className="browser-default">
                                            <span className="dropdown_item user-info">
                                                Welcome, {user.first_name}!
                                            </span>
                                        </li>
                                        <li className="browser-default">
                                            <Link
                                                className="dropdown_item logout-btn"
                                                onClick={handleLogout}>
                                                Logout
                                            </Link>
                                        </li>
                                    </>
                                ) : (
                                    <>
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
                                    </>
                                )}
                            </ul>
                        </li>
                    </ul>
                </div>
            </nav>
        </header>
    );
}
