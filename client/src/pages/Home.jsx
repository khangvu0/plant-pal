import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Home.css';
import headerVideo from '/plant-vid.mp4';
import plant from '/doc.jpg';
import water from '/water.jpg';
import sunlight from '/sunlight.jpg';

export default function Home() {
    return (
        <main>
            <section className="header-container">
                <video className="header-video" autoPlay loop muted playsinline>
                    <source src={headerVideo} type="video/mp4" />
                </video>
                <div className="video-overlay">
                    <h1>Your Personal Al Plant Expert!!</h1>
                    <p>Save money, save the planet, grow thriving plants </p>
                    <Link to="/login" className="hero-btn">
                        {' '}
                        Get started
                    </Link>
                </div>
            </section>

            <section className="statistics">
                <h2> Real Savings, Real Impact</h2>
                <div className="stat">
                    <div className="stat-sec">
                        <h2>50%</h2>
                        <p>Water Bills Cut</p>
                        <p className="des">Save $50-$90/month</p>
                    </div>

                    <div className="stat-sec">
                        <h2>87%</h2>
                        <p>Air Purified</p>
                        <p className="des">No electric purifier needed</p>
                    </div>

                    <div className="stat-sec">
                        <h2>$180</h2>
                        <p>Electricty Saved</p>
                        <p className="des">Annually on appliances</p>
                    </div>

                    <div className="stat-sec">
                        <h2>$400</h2>
                        <p>Annual Savings</p>
                        <p className="des">Total water + electricity</p>
                    </div>
                </div>
            </section>
            <section className="simple">
                <h2> Plant Care Made Simple</h2>
                <h4>
                    Everything you need to grow thriving plants while caring for
                    the environment
                </h4>
                <div className="dia">
                    <div className="txt">
                        <h4>AI Plant Diagnostics</h4>
                        <p>
                            Ask questions like "Why are my leaves yellow?" and
                            get instant, expert advice tailored to your plant's
                            needs with sustainable solutions
                        </p>
                    </div>
                    <img src={plant} alt="Plant Diagnostics" />
                </div>
                <div className="con">
                    <div className="txt">
                        <h4>Water Conservation</h4>
                        <p>
                            Learn minimal water techniques and sustainable
                            watering schedules that keep your plants healthy
                            while saving precious resources{' '}
                        </p>
                    </div>
                    <img src={water} alt="water" />
                </div>
                <div className="garden">
                    <div className="txt">
                        <h4>Organic Solutions </h4>
                        <p>
                            Get recommendations for organic nutrients and
                            natural pest control, avoiding harmful synthetic
                            fertilizers and chemical
                        </p>
                    </div>
                    <img src={sunlight} alt="sunlight" />
                </div>
            </section>
        </main>
    );
}
