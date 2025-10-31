import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Footer.css';
import fbIcon from '/facebook-brands-solid-full.svg';
import instaIcon from '/instagram-brands-solid-full.svg';
import linkedInIcon from '/linkedin-brands-solid-full.svg';

export default function Footer() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [isValid, setIsValid] = useState(null);

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!email) {
            setMessage('Please enter your email.');
            setIsValid(false);
            return;
        }

        if (!emailRegex.test(email)) {
            setMessage('Please enter a valid email address.');
            setIsValid(false);
        } else {
            setMessage('Success! You are now subscribed to our newsletter.');
            setIsValid(true);
            setEmail('');
        }
    };

    return (
        <footer className="footer">
            <div className="footer-content">
                {/* Brand / About */}
                <div className="footer-section">
                    <h2 className="footer-logo">PlantPal</h2>
                    <p className="footer-desc">
                        Lorem ipsum dolor sit amet, consectetur adipisicing
                        elit, sed do eiusmod tempor incididunt ut labore.
                    </p>
                </div>

                {/* Quick Links */}
                <div className="footer-section">
                    <h3 className="footer-title">Quick Links</h3>
                    <ul className="footer-links">
                        <li>
                            <Link to="/">Home</Link>
                        </li>
                        <li>
                            <Link to="/dashboard">Dashboard</Link>
                        </li>
                        <li>
                            <Link to="/register">Register</Link>
                        </li>
                        <li>
                            <Link to="/login">Login</Link>
                        </li>
                    </ul>
                </div>

                {/* Socials */}
                <div className="footer-section">
                    <h3 className="footer-title">Our Socials</h3>
                    <div className="social-icons">
                        <a href="https://www.facebook.com/" target="_blank">
                            <img src={fbIcon} alt="Facebook icon" />
                        </a>
                        <a href="https://www.instagram.com/" target="_blank">
                            <img src={instaIcon} alt="Instagram icon" />
                        </a>
                        <a href="https://www.linkedin.com/" target="_blank">
                            <img src={linkedInIcon} alt="LinkedIn icon" />
                        </a>
                    </div>
                </div>

                {/* Newsletter */}
                <div className="footer-section">
                    <h3 className="footer-title">
                        Subscribe to Our Newsletter
                    </h3>
                    <form className="newsletter-form" onSubmit={handleSubmit}>
                        <input
                            type="text"
                            placeholder="Your email address..."
                            className={`browser-default newsletter-input ${
                                isValid === false
                                    ? 'error'
                                    : isValid === true
                                    ? 'success'
                                    : ''
                            }`}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        <button type="submit">SUBSCRIBE</button>
                        {message && (
                            <p
                                className={`message ${
                                    isValid ? 'success-text' : 'error-text'
                                }`}>
                                {message}
                            </p>
                        )}
                    </form>
                </div>
            </div>

            <div className="footer-bottom">
                <p>Copyright © 2025 PlantPal | Khang, Alexander, Jhoana</p>
            </div>
        </footer>
    );
}
