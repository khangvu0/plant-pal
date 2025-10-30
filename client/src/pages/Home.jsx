import React from 'react';
import '../styles/Home.css';
import headerVideo from '../../public/plant-vid.mp4';

export default function Home() {
    return <main> 
          <section className="header-container">
                <video className="header-video" autoPlay loop muted playsinline>
                    <source src={headerVideo}type="video/mp4" />
                </video>
                <div className="video-overlay">
                    <h1>Your Personal Al Plant Expert!!</h1>
                    <p>Save money, save the planet, grow thriving plants </p>
                    <a href="/login"className="hero-btn"> Get started</a>
                </div>
            </section>
       
        <section className='statistics'>
             <h2> Real Savings, Real Impact</h2>
             <div className='stat' >
            <div className='stat-sec'>
                <h2>50%</h2>
                <p>Water Bills Cut</p>
                <p className='des'>Save $50-$90/month</p>
            </div>

            <div className='stat-sec'>
               <h2>87%</h2>
               <p>Air Purified</p>
               <p className='des'>No electric purifier needed</p>
            </div>

            <div className='stat-sec'>
                <h2>$180</h2>
                <p>Electricty Saved</p>
                <p className='des'>Annually on appliances</p>
            </div>

            <div className='stat-sec'>
                <h2>$400</h2>
                <p>Annual Savings</p>
                <p className='des'>Total water + electricity</p>
            </div>
            </div>

        </section>
        <section className='simple'>
        <h2> Plant Care Made Simple</h2>
        <h4>Everything you need to grow thriving plants while caring for the environment</h4>
            <div className='dia'>
                <h4>AI Plant Diagnostics</h4>
                <p>Ask questions, get instant expert advice</p>
            </div>
            <div className='con'>
                <h4>Water Conservation</h4>
                <p>Learn minimal water techniques and sustainable watering schedules that keep your 
                    plants healthy while saving precious resources </p>
            </div>
            <div className='garden'> 
                <h4>Community Garden</h4>
                <p>Share tips, connect with plant lovers</p>
            </div>
        </section>
        
    </main>
}
