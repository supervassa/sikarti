import React from 'react';
import Navbar from '../../components/guest/Navbar';
import Hero from '../../components/guest/Hero';
import InfoCards from '../../components/guest/InfoCards';
import NewsSection from '../../components/guest/NewsSection';
import Footer from '../../components/guest/Footer';

const LandingPage = () => {
    return (
        <div className="font-sans text-gray-800 bg-gray-50 min-h-screen flex flex-col">
            <Navbar />
            <Hero />
            <InfoCards />
            <NewsSection />
            <Footer />
        </div>
    );
};

export default LandingPage;
