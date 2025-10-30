import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Footer.css';
import instaIcon from '/facebook-brands-solid-full.svg';
import fbIcon from '/instagram-brands-solid-full.svg';
import linkIcon from '/linkedin-brands-solid-full.svg';

export default function Footer() {
    return (
        <footer className="footer">
            <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet"></link>
            <div className="footer-link-container">
                <h1 className='footer-link-container_title'>PlantPal</h1>
                <p className='desc'>Lorem ipsum hsakjhc akjxsakjx kasna</p>
            </div>
            <div className="footer-link-container">
                <div className='footer-containers'>
                <h1 className="footer-link-container_title">Socials</h1>
                <Link to="/" className="footer-link">
                <img src={instaIcon} className="icon" alt="insta icon" />
                </Link>
                
                <Link to="/" className="footer-link">
                <img src={fbIcon} className="icon" alt="facebook icon" />
                </Link>
                
                <Link to="/" className="footer-link">
                <img src={linkIcon} className="icon" alt="linkedIn icon" />
                </Link>
                </div>
            </div>
            <div className="footer-link-container">
                <h2 className="footer-link-container_title">Links</h2>
                <Link to="/" className="footer-link">
                    Home
                </Link>
                <Link to="/dashboard" className="footer-link">
                    Dashboard
                </Link>
                <Link to="/register" className="footer-link">
                    Register
                </Link>
                <Link to="/login" className="footer-link">
                    Login
                </Link>
            </div>
                <p className='copyright'>Copyright @ 2025 PlantPal | Khang, Alexander, Jhoana</p>
        </footer>
    );
}
