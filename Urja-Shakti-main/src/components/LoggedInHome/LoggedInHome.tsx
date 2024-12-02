import React, { useEffect} from 'react';
import "./LoggedInHome.css";
import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

const LoggedInHome: React.FC = () => {
  const features = [
    {
      icon: <span className="emoji-icon">🔢</span>,
      title: "AI-Powered Calculator",
      description: "Accurately estimate your solar potential and savings with our AI-powered calculator.",
    },
    {
      icon: <span className="emoji-icon">☀️</span>,
      title: "Smart Roof Analysis",
      description: "Get precise roof measurements for optimal solar panel placement.",
    },
    {
      icon: <span className="emoji-icon">⚡</span>,
      title: "Energy Insights",
      description: "Understand your consumption patterns for personalized recommendations.",
    },
    {
      icon: <span className="emoji-icon">👨‍🔧</span>,
      title: "Expert Network",
      description: "Connect with certified local solar panel installers.",
    },
    
  ];
    // Scroll to the top when the component mounts
    useEffect(() => {
      window.scrollTo(0, 0);
    }, []);
  

  return (
    <div className="logged-in-home">
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div>
            <h1 className="hero-title">
              Harness the Sun's Power with <span className="gradient-text">UrjaShakti</span>
            </h1>
            <p className="hero-description">
              Discover how solar energy can transform your home, reduce your bills, and help the environment.
            </p>
            <div className="hero-buttons">
              <Link to="/calculator" className="btn btn-primary">
                Calculate Savings <ChevronRight className="btn-icon" />
              </Link>
            </div>
          </div>
          <div className="hero-image-wrapper">
            <img
              src="/images/house.jpg"
              alt="Solar panel setup"
              className="hero-image"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features">
        <div className="container">
          <h2 className="section-title">Our Innovative Features</h2>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                {feature.icon}
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="services">
        {/* Add your services content here */}
      </section>

      {/* About Section */}
      <section id="about" className="about">
        {/* Add your about content here */}
      </section>

      {/* Calculator Section */}
      <section id="calculator" className="calculator-section">
        <div className="container">
          <div className="calculator-grid">
            <div className="calculator-text">
              <h2 className="calculator-title">Calculate Your Solar Savings</h2>
              <p className="calculator-description">
                Use our AI-powered calculator to estimate your potential savings with solar energy. It’s fast, easy, and free!
              </p>
              <Link to="/calculator" className="btn btn-primary">
                Start Calculation <ChevronRight className="btn-icon" />
              </Link>
            </div>
            <div className="calculator-image-wrapper">
              <img
                src="/images/solar.jpg"
                alt="Solar Savings Calculator"
                className="calculator-image"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <h2 className="cta-title">Ready to Embrace Solar Energy?</h2>
          <p className="cta-description">
            Take the first step towards energy independence. Get your personalized solar plan today.
          </p>
          <Link to="/calculator" className="btn btn-primary">
            Get Your Free Solar Estimate <ChevronRight className="btn-icon" />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default LoggedInHome;
