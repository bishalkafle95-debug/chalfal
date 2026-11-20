import React from "react";
import { Link } from "react-router-dom";

// --- Icons ---
const ScreenIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" /><path d="M8 21h8M12 17v4" />
  </svg>
);
const ChatIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);
const MicIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
  </svg>
);
const LockIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
const RoomIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);
const UsersIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const TranslateIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M5 8l6 6" /><path d="M4 14l6-6 2-3" /><path d="M2 5h12" /><path d="M7 2h1" />
    <path d="M22 22l-5-10-5 10" /><path d="M14 18h6" />
  </svg>
);

function Home() {
  return (
    <div className="home-wrapper">
      {/* --- Embedded CSS for true responsiveness and hover effects --- */}
      <style>{`
        :root {
          --primary-dark: #1d3557;
          --primary-light: #457b9d;
          --accent: #e63946;
          --accent-light: #ffe3e3;
          --bg-light: #f8f9fa;
          --text-main: #333333;
          --text-muted: #666666;
        }
        
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
        
        /* Navigation */
        .nav { padding: 1rem 5%; background: #fff; border-bottom: 1px solid #eaeaea; position: sticky; top: 0; z-index: 100; }
        .nav-wrap { display: flex; justify-content: space-between; align-items: center; max-width: 1400px; margin: 0 auto; }
        .logo { display: flex; align-items: center; text-decoration: none; color: var(--text-main); font-size: 1.5rem; font-weight: bold; }
        .logo-icon { margin-right: 10px; color: var(--accent); display: flex; }
        .logo-nepali { font-size: 1rem; color: #888; margin-left: 8px; font-weight: normal; }
        .nav-right { display: flex; gap: 15px; align-items: center; }
        .btn-ghost-nav { padding: 8px 16px; text-decoration: none; color: var(--text-main); font-weight: 500; transition: color 0.2s; }
        .btn-ghost-nav:hover { color: var(--accent); }
        .btn-start { padding: 10px 20px; background: var(--accent); color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold; display: flex; align-items: center; gap: 6px; transition: background 0.3s, transform 0.2s; }
        .btn-start:hover { background: #c1121f; transform: translateY(-2px); }

        /* Hero Section */
        .hero { padding: 5rem 5%; text-align: center; background: var(--bg-light); }
        .hero-inner { max-width: 900px; margin: 0 auto; }
        .pill { display: inline-flex; align-items: center; padding: 6px 16px; background: var(--accent-light); color: #c1121f; border-radius: 50px; font-size: 0.9rem; font-weight: 600; margin-bottom: 1.5rem; }
        .pill-dot { width: 8px; height: 8px; background: #c1121f; border-radius: 50%; margin-right: 8px; }
        .hero-title { font-size: clamp(2.5rem, 5vw, 4rem); line-height: 1.2; color: var(--primary-dark); margin-bottom: 1.5rem; font-weight: 800; }
        .hero-title span { color: var(--accent); }
        .hero-sub { font-size: clamp(1rem, 2vw, 1.2rem); color: var(--text-muted); margin-bottom: 2.5rem; line-height: 1.6; }
        .btn-big { display: inline-flex; padding: 16px 32px; background: var(--primary-dark); color: #fff; text-decoration: none; border-radius: 8px; font-size: 1.2rem; align-items: center; gap: 10px; font-weight: 600; transition: all 0.3s ease; box-shadow: 0 4px 15px rgba(29, 53, 87, 0.3); }
        .btn-big:hover { background: #14243b; transform: translateY(-3px); box-shadow: 0 6px 20px rgba(29, 53, 87, 0.4); }
        .hero-image-container { margin: 4rem auto 0; max-width: 1000px; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.15); }
        .hero-image-container img { width: 100%; height: auto; display: block; object-fit: cover; }

        /* Translation Section */
        .section-translation { padding: 6rem 5%; background: #fff; }
        .translation-container { max-width: 1200px; margin: 0 auto; display: flex; align-items: center; gap: 4rem; flex-wrap: wrap; }
        .translation-text { flex: 1 1 400px; }
        .translation-icon-wrapper { display: inline-flex; align-items: center; justify-content: center; width: 64px; height: 64px; background: var(--accent); color: #fff; border-radius: 16px; margin-bottom: 1.5rem; }
        .translation-title { font-size: clamp(2rem, 3vw, 2.5rem); color: var(--primary-dark); margin-bottom: 1.5rem; }
        .translation-p { font-size: 1.1rem; color: var(--text-muted); line-height: 1.8; margin-bottom: 1.5rem; }
        .translation-list { list-style: none; color: var(--primary-dark); font-size: 1.1rem; font-weight: 500; }
        .translation-list li { margin-bottom: 12px; display: flex; align-items: center; gap: 10px; }
        
        .translation-visual { flex: 1 1 400px; position: relative; border-radius: 16px; box-shadow: 0 15px 35px rgba(0,0,0,0.1); overflow: hidden; }
        .translation-visual img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .subtitle-overlay { position: absolute; bottom: 20px; left: 5%; right: 5%; background: rgba(0,0,0,0.85); color: #fff; padding: 15px; border-radius: 12px; font-size: clamp(0.9rem, 2vw, 1.1rem); text-align: center; border-left: 4px solid var(--accent); backdrop-filter: blur(4px); }
        .subtitle-nepali { font-style: italic; opacity: 0.9; margin-bottom: 5px; display: block; }
        .subtitle-english { color: #ffb703; font-weight: 600; display: block; }

        /* Features Section */
        .section-features { padding: 6rem 5%; background: var(--bg-light); }
        .features-header { text-align: center; margin-bottom: 4rem; max-width: 700px; margin-left: auto; margin-right: auto; }
        .features-title { font-size: clamp(2rem, 3vw, 2.5rem); color: var(--primary-dark); margin-bottom: 1rem; }
        .feat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; max-width: 1200px; margin: 0 auto; }
        .feat-card { background: #fff; padding: 2.5rem 2rem; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.04); transition: transform 0.3s, box-shadow 0.3s; border: 1px solid transparent; }
        .feat-card:hover { transform: translateY(-5px); box-shadow: 0 10px 30px rgba(0,0,0,0.08); border-color: #eaeaea; }
        .feat-icon { color: var(--primary-light); margin-bottom: 1.5rem; display: inline-block; padding: 12px; background: #f1f5f9; border-radius: 12px; }
        .feat-card h3 { font-size: 1.3rem; color: var(--primary-dark); margin-bottom: 1rem; }
        .feat-card p { color: var(--text-muted); line-height: 1.6; }

        /* Nepal Section */
        .section-nepal { padding: 6rem 5%; background: var(--primary-dark); color: #fff; text-align: center; }
        .nepal-container { max-width: 800px; margin: 0 auto; }
        .nepal-title { font-size: clamp(2rem, 3vw, 2.5rem); margin-bottom: 1.5rem; }
        .nepal-p { font-size: 1.2rem; line-height: 1.8; color: #a8dadc; margin-bottom: 3rem; }
        .nepal-images { display: flex; justify-content: center; gap: 20px; flex-wrap: wrap; }
        .nepal-images img { border-radius: 50%; width: 140px; height: 140px; object-fit: cover; border: 4px solid var(--accent); transition: transform 0.3s; }
        .nepal-images img:hover { transform: scale(1.05); }

        /* Footer */
        .footer { padding: 4rem 5% 2rem; background: #0b192c; color: #fff; text-align: center; }
        .footer-content { max-width: 1200px; margin: 0 auto; display: flex; flex-direction: column; align-items: center; gap: 15px; }
        .footer-text { color: #888; font-size: 0.95rem; }
        .footer-quote { color: #a8dadc; font-style: italic; margin-top: 10px; font-weight: 500; }

        /* Responsive Adjustments */
        @media (max-width: 768px) {
          .nav-wrap { flex-direction: column; gap: 15px; }
          .hero { padding: 3rem 5%; }
          .translation-container { gap: 2rem; }
          .translation-visual { order: -1; width: 100%; } /* Image on top for mobile */
          .feat-grid { grid-template-columns: 1fr; }
          .nepal-images img { width: 100px; height: 100px; }
        }
      `}</style>

      {/* --- Navigation --- */}
      <nav className="nav">
        <div className="nav-wrap">
          <Link to="/" className="logo">
            <div className="logo-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
              </svg>
            </div>
            Chalfal <span className="logo-nepali">छलफल</span>
          </Link>
          <div className="nav-right">
            <Link to="/login" className="btn-ghost-nav">Sign in</Link>
            <Link to="/signup" className="btn-start">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />
              </svg>
              Get started
            </Link>
          </div>
        </div>
      </nav>

      <main>
        {/* --- Hero Section --- */}
        <section className="hero">
          <div className="hero-inner">
            <div className="pill">
              <span className="pill-dot" />
              
            </div>
            <h1 className="hero-title">
              Connect Globally.<br /> 
              <span>Understand Instantly.</span>
            </h1>
            <p className="hero-sub">
              <strong>छलफल (Chalfal)</strong> is more than just a video conferencing platform. It is a communication bridge. 
              Host high-quality meetings straight from your browser with our groundbreaking <strong>Live Subtitle Translation</strong> feature.
            </p>
            <Link to="/signup" className="btn-big">
              Start a meeting
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          
          <div className="hero-image-container">
            <img 
              src="https://www.zohowebstatic.com/sites/zweb/images/meeting/remote-work/zm-vc-tb.png" 
              alt="Diverse team meeting online" 
            />
          </div>
        </section>

        {/* --- Core Feature: Live Translation --- */}
        <section className="section-translation">
          <div className="translation-container">
            
            <div className="translation-text">
              <div className="translation-icon-wrapper">
                <TranslateIcon />
              </div>
              <h2 className="translation-title">Break the Language Barrier</h2>
              <p className="translation-p">
                Have you ever been in a meeting where language was a hurdle? With Chalfal's AI-powered translation engine, those days are over. 
              </p>
              <p className="translation-p">
                <strong>How it works:</strong> If a participant speaks in Hindi, Nepali, or Spanish, our platform listens, transcribes, and instantly generates <strong>English subtitles</strong> on the screens of other participants. It is seamless, fast, and requires no third-party extensions.
              </p>
              <ul className="translation-list">
                <li>✅ Real-time speech recognition</li>
                <li>✅ Instant subtitle overlay</li>
                <li>✅ Supports major global languages</li>
                <li>✅ Perfect for international clients & education</li>
              </ul>
            </div>

            <div className="translation-visual">
               <img 
                 src="https://images.unsplash.com/photo-1573164713988-8665fc963095?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                 alt="Business meeting interface" 
               />
               <div className="subtitle-overlay">
                  <span className="subtitle-nepali">🗣️ "नमस्ते, मिटिङमा स्वागत छ।"</span>
                  <span className="subtitle-english">Subtitle: Hello, welcome to the meeting.</span>
               </div>
            </div>

          </div>
        </section>

        {/* --- Standard Features Grid --- */}
        <section className="section-features" id="features">
          <div className="features-header">
            <h2 className="features-title">Everything you need to meet</h2>
            <p className="translation-p">
              Beyond translation, Chalfal packs all the robust features you expect from a premium, distraction-free video conferencing tool.
            </p>
          </div>
          
          <div className="feat-grid">
            <div className="feat-card">
              <div className="feat-icon"><ScreenIcon /></div>
              <h3>High-Def Screen Sharing</h3>
              <p>Share your screen instantly to present slides, collaborate on documents, or teach complex concepts in real-time without any lag.</p>
            </div>

            <div className="feat-card">
              <div className="feat-icon"><ChatIcon /></div>
              <h3>In-Meeting Chat</h3>
              <p>Drop links, send files, or share thoughts in the text chat to everyone in the room without interrupting the active speaker.</p>
            </div>

            <div className="feat-card">
              <div className="feat-icon"><MicIcon /></div>
              <h3>Total Room Control</h3>
              <p>Hosts have ultimate control. Mute participants, manage cameras, and ensure the meeting runs smoothly without background noise.</p>
            </div>

            <div className="feat-card">
              <div className="feat-icon"><RoomIcon /></div>
              <h3>Instant, No-Download Rooms</h3>
              <p>Create a meeting room in seconds. Share the unique generated code, and participants can join directly from their web browsers.</p>
            </div>

            <div className="feat-card">
              <div className="feat-icon"><UsersIcon /></div>
              <h3>Dynamic Grid View</h3>
              <p>Host large meetings with multiple participants. Our responsive UI automatically organizes video feeds into a clean, easy-to-see grid.</p>
            </div>

            <div className="feat-card">
              <div className="feat-icon"><LockIcon /></div>
              <h3>Secure & Encrypted</h3>
              <p>Your privacy is paramount. Accounts are protected with encrypted passwords, and video data is securely routed.</p>
            </div>
          </div>
        </section>

        {/* --- Built for Nepal --- */}
        <section className="section-nepal">
          <div className="nepal-container">
            <h2 className="nepal-title">Proudly Engineered in Nepal 🇳🇵</h2>
           
           
          </div>
        </section>
      </main>

      {/* --- Footer --- */}
      <footer className="footer">
        <div className="footer-content">
          <div className="logo-icon" style={{ color: '#e63946' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
          </div>
          <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Chalfal (छलफल)</p>
          <p className="footer-text">&copy; 2026 Chalfal. Final Year Project. All rights reserved.</p>
          <p className="footer-quote">"Let's meet, let's understand each other."</p>
        </div>
      </footer>
    </div>
  );
}

export default Home;
