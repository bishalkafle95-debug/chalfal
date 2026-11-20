import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, API_BASE } from "../context/AuthContext.jsx";

// --- Icons ---
const VideoIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
  </svg>
);
const JoinIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />
  </svg>
);
const ClockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);

function Dashboard() {
  const { user, token, logout } = useAuth();
  const [meetingTitle, setMeetingTitle] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [myMeetings, setMyMeetings] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const fetchMeetings = async () => {
    try {
      const res = await fetch(`${API_BASE}/meetings/mine`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setMyMeetings(data.meetings || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMeetings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch(`${API_BASE}/meetings/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: meetingTitle || "Untitled Meeting" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Could not create meeting.");
        return;
      }
      navigate(`/meeting/${data.meeting.roomCode}`);
    } catch (err) {
      setError("Could not connect to server.");
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    setError("");
    if (!joinCode.trim()) {
      setError("Please enter a room code.");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/meetings/${joinCode.trim()}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Meeting room not found.");
        return;
      }
      navigate(`/meeting/${joinCode.trim()}`);
    } catch (err) {
      setError("Could not connect to server.");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="dash-wrapper">
      <style>{`
        /* Reusing exact variables from branding for perfect consistency */
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
        
        .dash-wrapper {
          min-height: 100vh;
          background-color: var(--bg-light);
          display: flex;
          flex-direction: column;
        }

        /* --- Navigation (Exactly matching branding) --- */
        .nav { padding: 1rem 5%; background: #fff; border-bottom: 1px solid #eaeaea; position: sticky; top: 0; z-index: 100; }
        .nav-wrap { display: flex; justify-content: space-between; align-items: center; max-width: 1400px; margin: 0 auto; }
        .logo { display: flex; align-items: center; text-decoration: none; color: var(--text-main); font-size: 1.5rem; font-weight: bold; }
        .logo-icon { margin-right: 10px; color: var(--accent); display: flex; }
        .logo-nepali { font-size: 1rem; color: #888; margin-left: 8px; font-weight: normal; }
        .nav-right { display: flex; gap: 15px; align-items: center; }
        
        .btn-ghost-nav { 
          padding: 8px 16px; 
          background: transparent;
          border: none;
          color: var(--text-main); 
          font-weight: 600; 
          font-size: 1rem;
          cursor: pointer;
          transition: color 0.2s; 
        }
        .btn-ghost-nav:hover { color: var(--accent); }

        /* --- Dashboard Main Content --- */
        .dash-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 3rem 5%;
          width: 100%;
        }

        .dash-header {
          margin-bottom: 3rem;
        }
        .dash-header h1 {
          font-size: clamp(2rem, 3vw, 2.5rem);
          color: var(--primary-dark);
          margin-bottom: 0.5rem;
          font-weight: 800;
        }
        .dash-header p {
          color: var(--text-muted);
          font-size: 1.1rem;
        }

        .auth-error {
          background: var(--accent-light);
          color: #c1121f;
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 2rem;
          font-size: 0.95rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 8px;
          border-left: 4px solid #c1121f;
        }

        /* --- Actions Grid (Cards) --- */
        .dash-actions {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
          margin-bottom: 4rem;
        }

        .action-card {
          background: #fff;
          padding: 2.5rem;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.04);
          border: 1px solid #eaeaea;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .action-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 30px rgba(0,0,0,0.08);
        }

        .action-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 50px;
          height: 50px;
          background: #f1f5f9;
          color: var(--primary-light);
          border-radius: 12px;
          margin-bottom: 1.5rem;
        }

        .action-card h3 {
          font-size: 1.3rem;
          color: var(--primary-dark);
          margin-bottom: 0.5rem;
        }
        .action-card p {
          color: var(--text-muted);
          font-size: 0.95rem;
          line-height: 1.5;
          margin-bottom: 1.5rem;
        }

        /* Forms inside Cards */
        .form-input {
          width: 100%;
          padding: 14px 16px;
          background: #f9fafb;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 1rem;
          color: var(--text-main);
          transition: all 0.2s ease;
          margin-bottom: 1rem;
        }
        .form-input::placeholder { color: #9ca3af; }
        .form-input:focus {
          outline: none;
          background: #fff;
          border-color: var(--primary-light);
          box-shadow: 0 0 0 3px rgba(69, 123, 157, 0.15);
        }

        .btn-primary {
          width: 100%;
          padding: 14px;
          background: var(--primary-dark);
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 1.05rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .btn-primary:hover { background: #14243b; }

        .btn-outline {
          width: 100%;
          padding: 14px;
          background: transparent;
          color: var(--primary-dark);
          border: 2px solid var(--primary-dark);
          border-radius: 8px;
          font-size: 1.05rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .btn-outline:hover { background: #f1f5f9; }

        /* --- Meetings List --- */
        .meetings-section h2 {
          font-size: 1.5rem;
          color: var(--primary-dark);
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .meetings-list {
          background: #fff;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.04);
          border: 1px solid #eaeaea;
          overflow: hidden;
        }

        .empty-note {
          padding: 3rem;
          text-align: center;
          color: var(--text-muted);
          font-size: 1.05rem;
          background: #fafafa;
        }

        .meeting-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem 2rem;
          border-bottom: 1px solid #eaeaea;
          transition: background 0.2s;
        }
        .meeting-row:last-child { border-bottom: none; }
        .meeting-row:hover { background: #f8f9fa; }

        .m-info { display: flex; flex-direction: column; gap: 4px; }
        .m-title { font-weight: 600; color: var(--primary-dark); font-size: 1.1rem; }
        .m-code { color: var(--text-muted); font-size: 0.9rem; font-family: monospace; background: #f1f5f9; padding: 2px 8px; border-radius: 4px; width: fit-content; }

        .btn-rejoin {
          padding: 8px 16px;
          background: var(--accent-light);
          color: #c1121f;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .btn-rejoin:hover { background: #ffccd0; }

        @media (max-width: 640px) {
          .meeting-row { flex-direction: column; align-items: flex-start; gap: 1rem; }
          .btn-rejoin { width: 100%; }
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
            <button className="btn-ghost-nav" onClick={handleLogout}>Log out</button>
          </div>
        </div>
      </nav>

      {/* --- Main Dashboard Content --- */}
      <main className="dash-container">
        
        <div className="dash-header">
          <h1>Welcome, {user?.fullName || "there"} 👋</h1>
          <p>Start a new meeting or join one with a room code.</p>
        </div>

        {error && (
          <div className="auth-error">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        {/* --- Action Cards --- */}
        <div className="dash-actions">
          
          <div className="action-card">
            <div className="action-icon"><VideoIcon /></div>
            <h3>Start a new meeting</h3>
            <p>Create an instant meeting room and invite others using a unique generated room code.</p>
            <form onSubmit={handleCreate}>
              <input
                type="text"
                className="form-input"
                placeholder="Meeting title (optional)"
                value={meetingTitle}
                onChange={(e) => setMeetingTitle(e.target.value)}
              />
              <button type="submit" className="btn-primary">Start Meeting</button>
            </form>
          </div>

          <div className="action-card">
            <div className="action-icon"><JoinIcon /></div>
            <h3>Join a meeting</h3>
            <p>Enter a room code shared with you to join an ongoing meeting instantly.</p>
            <form onSubmit={handleJoin}>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. abc-def-ghi"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
              />
              <button type="submit" className="btn-outline">Join Meeting</button>
            </form>
          </div>

        </div>

        {/* --- Recent Meetings List --- */}
        <div className="meetings-section">
          <h2><ClockIcon /> Your Meetings</h2>
          
          <div className="meetings-list">
            {myMeetings.length === 0 ? (
              <div className="empty-note">
                You haven't created any meetings yet. Start one above!
              </div>
            ) : (
              myMeetings.map((m) => (
                <div className="meeting-row" key={m.id || m.roomCode}>
                  <div className="m-info">
                    <div className="m-title">{m.title || "Untitled Meeting"}</div>
                    <div className="m-code">Code: {m.roomCode}</div>
                  </div>
                  <button className="btn-rejoin" onClick={() => navigate(`/meeting/${m.roomCode}`)}>
                    Rejoin Room
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

      </main>
    </div>
  );
}

export default Dashboard;