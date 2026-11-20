import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, API_BASE } from "../context/AuthContext.jsx";

function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Login failed.");
        setLoading(false);
        return;
      }
      login(data.user, data.token);
      navigate("/dashboard");
    } catch (err) {
      setError("Could not connect to server. Is the backend running?");
    }
    setLoading(false);
  };

  return (
    <div className="page-wrapper">
      <style>{`
        /* Reusing exact variables from Home.jsx */
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
        
        .page-wrapper {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background-color: var(--bg-light);
        }

        /* --- Navigation (Exactly matching Home.jsx) --- */
        .nav { padding: 1rem 5%; background: #fff; border-bottom: 1px solid #eaeaea; position: sticky; top: 0; z-index: 100; }
        .nav-wrap { display: flex; justify-content: space-between; align-items: center; max-width: 1400px; margin: 0 auto; }
        .logo { display: flex; align-items: center; text-decoration: none; color: var(--text-main); font-size: 1.5rem; font-weight: bold; }
        .logo-icon { margin-right: 10px; color: var(--accent); display: flex; }
        .logo-nepali { font-size: 1rem; color: #888; margin-left: 8px; font-weight: normal; }
        .nav-right { display: flex; gap: 15px; align-items: center; }
        
        .btn-start { padding: 10px 20px; background: var(--accent); color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold; display: flex; align-items: center; gap: 6px; transition: background 0.3s, transform 0.2s; }
        .btn-start:hover { background: #c1121f; transform: translateY(-2px); }

        /* --- Split Screen Layout --- */
        .split-layout {
          display: flex;
          flex: 1; /* Takes up remaining height after nav */
        }
        
        .split-left {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4rem 5%;
          background: #fff; /* Clean white background for the form side */
        }

        .split-right {
          flex: 1;
          display: none; /* Hidden on mobile devices */
          /* Beautiful placeholder image of Nepal / Himalayas */
          background-image: url('https://images.unsplash.com/photo-1544735716-392fe2489ffa?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80');
          background-size: cover;
          background-position: center;
          position: relative;
        }

        /* Dark overlay on the photo to make text readable */
        .split-right-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, rgba(29, 53, 87, 0.3), rgba(29, 53, 87, 0.9));
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 4rem;
          color: white;
        }

        /* --- Main Login Form Area --- */
        .auth-card {
          width: 100%;
          max-width: 420px;
        }

        .auth-header {
          margin-bottom: 2.5rem;
        }

        .auth-title { 
          font-size: 2rem; 
          color: var(--primary-dark); 
          margin-bottom: 0.5rem; 
          font-weight: 800; 
        }
        
        .auth-sub { 
          color: var(--text-muted); 
          font-size: 1rem; 
          line-height: 1.5;
        }

        .auth-error {
          background: var(--accent-light);
          color: #c1121f;
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 1.5rem;
          font-size: 0.95rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 8px;
          border-left: 4px solid #c1121f;
        }

        /* --- Form Styling (Matching Home) --- */
        .form-group { margin-bottom: 1.5rem; }
        .form-group label { 
          display: flex; 
          justify-content: space-between;
          margin-bottom: 8px; 
          color: var(--primary-dark); 
          font-size: 0.95rem; 
          font-weight: 600; 
        }
        
        .form-input {
          width: 100%;
          padding: 14px 16px;
          background: #f9fafb;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 1rem;
          color: var(--text-main);
          transition: all 0.2s ease;
        }
        .form-input::placeholder { color: #9ca3af; }
        .form-input:focus {
          outline: none;
          background: #fff;
          border-color: var(--primary-light);
          box-shadow: 0 0 0 3px rgba(69, 123, 157, 0.15);
        }

        .forgot-link { 
          color: var(--primary-light); 
          font-size: 0.85rem; 
          text-decoration: none; 
          font-weight: 500;
          cursor: pointer;
        }
        .forgot-link:hover { color: var(--primary-dark); text-decoration: underline; }

        /* Button matching the Home.jsx '.btn-big' */
        .btn-submit {
          width: 100%;
          padding: 16px;
          background: var(--primary-dark);
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 1rem;
          box-shadow: 0 4px 15px rgba(29, 53, 87, 0.2);
        }
        .btn-submit:hover:not(:disabled) { 
          background: #14243b; 
          transform: translateY(-2px); 
          box-shadow: 0 6px 20px rgba(29, 53, 87, 0.3);
        }
        .btn-submit:active:not(:disabled) { transform: translateY(0); }
        .btn-submit:disabled { opacity: 0.7; cursor: not-allowed; }

        .auth-footer { 
          margin-top: 2rem; 
          text-align: center; 
          color: var(--text-muted); 
          font-size: 0.95rem; 
        }
        .auth-footer a { 
          color: var(--accent); 
          text-decoration: none; 
          font-weight: bold; 
        }
        .auth-footer a:hover { text-decoration: underline; }

        @media (min-width: 900px) {
          .split-right { display: block; }
        }
      `}</style>

      {/* --- Navigation (Shared with Home) --- */}
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
            <span style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>New here?</span>
            <Link to="/signup" className="btn-start">
              Sign up
            </Link>
          </div>
        </div>
      </nav>

      {/* --- Main Split Layout --- */}
      <div className="split-layout">
        
        {/* Left Side: Form */}
        <div className="split-left">
          <div className="auth-card">
            <div className="auth-header">
              <h1 className="auth-title">Welcome Back</h1>
              <p className="auth-sub">Sign in to your Chalfal account to join your next meeting.</p>
            </div>

            {error && (
              <div className="auth-error">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Email address</label>
                <input
                  type="email"
                  name="email"
                  className="form-input"
                  required
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                />
              </div>
              
              <div className="form-group">
                <label>
                  Password
                  <span className="forgot-link">Forgot password?</span>
                </label>
                <input
                  type="password"
                  name="password"
                  className="form-input"
                  required
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                />
              </div>
              
              <button type="submit" className="btn-submit" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>
          </div>
        </div>

        {/* Right Side: Photo */}
        <div className="split-right">
          <div className="split-right-overlay">
            <div style={{ display: 'inline-block', padding: '6px 16px', backgroundColor: 'rgba(255,227,227,0.2)', color: '#ffb703', borderRadius: '50px', fontSize: '0.9rem', marginBottom: '1.5rem', fontWeight: 'bold', width: 'fit-content', backdropFilter: 'blur(4px)' }}>
              Built in Nepal 🇳🇵
            </div>
            <h2 style={{ fontSize: '3rem', marginBottom: '1rem', lineHeight: '1.2', fontWeight: '800' }}>
              Connect Globally.<br /> 
              <span style={{ color: '#ffb703' }}>Understand Instantly.</span>
            </h2>
            <p style={{ fontSize: '1.2rem', opacity: 0.9, maxWidth: '400px', lineHeight: '1.6' }}>
              Experience borderless communication with our real-time AI subtitle translation engine.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Login;