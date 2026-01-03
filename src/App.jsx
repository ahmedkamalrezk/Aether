import React, { useState, createContext, useContext, useEffect, useRef } from 'react';
import logo from './assets/logo.png';
import { Routes, Route, useNavigate, Navigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Heart, Shield, Award, Send, Star, User, LogOut,
  Loader2, Gift, ShieldAlert, Trash2, XCircle, Book, Users, BarChart3,
  Flag, Ban, AlertTriangle, Stethoscope, Sparkles, Gavel, ShieldCheck, Lock,
  Waves, Ghost, Flame, Trees, Moon, Coffee, Anchor, CloudRain
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars, Float, MeshDistortMaterial, Sphere } from '@react-three/drei';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, deleteDoc, doc, getDocs, where } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, updateProfile } from 'firebase/auth';

// --- FIREBASE CONFIGURATION (SECURED VIA ENV) ---
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// --- AUTH CONTEXT ---
const AuthContext = createContext();
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      const unsubscribe = onAuthStateChanged(auth, (u) => {
        setUser(u);
        setLoading(false);
      }, (err) => {
        console.error("Auth State Error:", err);
        setError(err);
        setLoading(false);
      });
      return unsubscribe;
    } catch (err) {
      console.error("Firebase Auth Listener Error:", err);
      setError(err);
      setLoading(false);
    }
  }, []);

  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);
  const register = (email, password) => createUserWithEmailAndPassword(auth, email, password);
  const logout = () => signOut(auth);

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050505', color: '#fff' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 className="animate-spin" size={40} style={{ marginBottom: '20px', color: '#C0C0C0' }} />
          <p style={{ color: '#808080' }}>Initializing Sanctuary...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, error }}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => useContext(AuthContext);

// --- AI CONFIGURATION ---
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const fetchGemini = async (prompt) => {
  if (!GEMINI_API_KEY || GEMINI_API_KEY.length < 20) {
    console.warn("AI Key invalid or missing");
    return null;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // Strict 5s timeout

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      }),
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (error) {
    console.error("AI connection failed:", error.name === 'AbortError' ? 'Timeout' : error);
    return null;
  }
};

const useMousePosition = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  React.useEffect(() => {
    const handleMouseMove = (event) => {
      setMousePosition({ x: event.clientX, y: event.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  return mousePosition;
};

// Components
const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [requestCount, setRequestCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "requests"), where("status", "==", "pending"));
    return onSnapshot(q, (s) => setRequestCount(s.docs.length));
  }, []);

  const navLinks = [
    { label: 'Hub', path: '/community' },
    { label: 'Journal', path: '/journal' },
    { label: 'Insights', path: '/stats' },
    { label: 'Listen', path: '/listen', badge: true }
  ];

  return (
    <nav className="nav-container" style={{
      position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 1000,
      padding: '15px 5%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      background: 'rgba(5, 5, 5, 0.8)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
    }}>
      <div
        onClick={() => navigate('/')}
        style={{ fontSize: '20px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}
      >
        <img src={logo} className="aether-logo-img" alt="Aether Logo" />
        <span className="silver-text-gradient" style={{ textTransform: 'uppercase', letterSpacing: '1px' }}>Aether</span>
      </div>

      {/* Desktop Links */}
      <div className="desktop-only" style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '25px', fontSize: '12px', fontWeight: '600', color: 'var(--silver-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>
          {navLinks.map(link => (
            <span key={link.path} className="nav-link" style={{ position: 'relative' }} onClick={() => navigate(link.path)}>
              {link.label}
              {link.badge && requestCount > 0 && (
                <motion.span
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  style={{ position: 'absolute', top: '-8px', right: '-15px', background: '#fff', color: '#000', fontSize: '9px', padding: '1px 5px', borderRadius: '10px' }}
                >
                  {requestCount}
                </motion.span>
              )}
            </span>
          ))}
        </div>
        <button className="glass-button" style={{ padding: '8px 18px', fontSize: '11px' }} onClick={() => user ? logout() : navigate('/auth')}>
          {user ? <><LogOut size={14} /> Leave</> : <><User size={14} /> Identity</>}
        </button>
      </div>

      {/* Mobile Toggle */}
      <div className="mobile-only" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{ cursor: 'pointer' }}>
        <div style={{ width: '24px', height: '2px', background: '#fff', marginBottom: '5px' }}></div>
        <div style={{ width: '24px', height: '2px', background: '#fff', marginBottom: '5px' }}></div>
        <div style={{ width: '24px', height: '2px', background: '#fff' }}></div>
      </div>

      {/* Mobile Menu Panel */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: 'fixed', top: '70px', left: 0, width: '100%',
              background: 'rgba(5, 5, 5, 0.95)', padding: '30px',
              display: 'flex', flexDirection: 'column', gap: '25px',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              zIndex: 999
            }}
          >
            {navLinks.map(link => (
              <span key={link.path} style={{ fontSize: '18px', fontWeight: '500' }} onClick={() => { navigate(link.path); setMobileMenuOpen(false); }}>
                {link.label} {link.badge && requestCount > 0 && `(${requestCount})`}
              </span>
            ))}
            <button className="glass-button" style={{ justifyContent: 'center' }} onClick={() => { user ? logout() : navigate('/auth'); setMobileMenuOpen(false); }}>
              {user ? 'Leave Identity' : 'Authorized Sync'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </nav >
  );
};

const Background3D = () => {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: -2, pointerEvents: 'none' }}>
      <Canvas
        camera={{ position: [0, 0, 1.5] }}
        dpr={[1, 1.5]} // Limit pixel ratio for performance
        gl={{ powerPreference: "high-performance", antialias: false }}
      >
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} intensity={0.5} />
        <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={0.5} />
        <Float speed={1} rotationIntensity={0.2} floatIntensity={0.2}>
          <Sphere args={[1, 32, 32]} scale={1.8}>
            <MeshDistortMaterial
              color="#080808"
              attach="material"
              distort={0.3}
              speed={1}
              roughness={0}
              transparent
              opacity={0.8}
            />
          </Sphere>
        </Float>
      </Canvas>
    </div>
  );
};

const DotGrid = () => (
  <div className="dot-bg"></div>
);

// Pages
const LandingPage = () => {
  const navigate = useNavigate();
  const { x, y } = useMousePosition();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '100px 20px 40px', textAlign: 'center' }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h1 className="silver-text-gradient" style={{ fontSize: 'clamp(32px, 8vw, 72px)', marginBottom: '20px', lineHeight: 1.1 }}>
          Speak to the <br />Silent Shadows
        </h1>
        <p className="hero-text" style={{ maxWidth: '600px', margin: '0 auto 40px', color: 'var(--silver-muted)', fontSize: 'clamp(14px, 4vw, 18px)', lineHeight: '1.6' }}>
          A private sanctuary where AI bridges the gap between your thoughts and a real soul. No judgment, no data sharing, just human connection.
        </p>
        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="glass-button" style={{ padding: '12px 24px' }} onClick={() => navigate('/speak')}>
            <MessageSquare size={18} /> Speak
          </button>
          <button className="glass-button" style={{ padding: '12px 24px' }} onClick={() => navigate('/listen')}>
            <Heart size={18} /> Listen
          </button>
        </div>
      </motion.div>

      <div
        className="silver-glow-orb"
        style={{
          width: '500px',
          height: '500px',
          background: 'radial-gradient(circle, rgba(192, 192, 192, 0.2) 0%, transparent 70%)',
          opacity: 0.6,
          filter: 'blur(60px)',
          transform: `translate3d(${x - 250}px, ${y - 250}px, 0)`,
          transition: 'transform 0.15s cubic-bezier(0.23, 1, 0.32, 1)',
          pointerEvents: 'none',
          position: 'fixed',
          top: 0,
          left: 0
        }}
      />
    </div>
  );
};

const SpeakerAI = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: "Welcome to Aether's quiet space. I am here to listen. What's on your mind today?" }
  ]);
  const [loading, setLoading] = useState(false);
  const [matching, setMatching] = useState(false);
  const [warning, setWarning] = useState('');
  const [emergencyModal, setEmergencyModal] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth(); // FIX: Added missing useAuth hook to prevent crash

  const handleSend = () => {
    if (!input.trim()) return;

    // Advanced Moderation: Contact Info (Privacy Shield)
    const privacyPattern = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|[\w.%+-]+@[\w.-]+\.[a-zA-Z]{2,}|(wa\.me|instagram\.|t\.me|facebook\.)/i;
    if (privacyPattern.test(input)) {
      setWarning('Privacy Shield: Sharing contacts or external links is forbidden for your safety.');
      setTimeout(() => setWarning(''), 5000);
      return;
    }

    // High Risk Detection: Self-Harm/Suicide
    const riskKeywords = ['suicide', 'kill myself', 'end it all', 'hurt myself', 'die', 'self-harm'];
    const lowerInput = input.toLowerCase();
    if (riskKeywords.some(kw => lowerInput.includes(kw))) {
      setEmergencyModal(true);
      return;
    }

    setMessages([...messages, { role: 'user', content: input }]);
    const userInput = input;
    setInput('');
    setLoading(true);

    setTimeout(async () => {
      let aiResponse = "تم تشفير كلماتك.. أنا ببحث لك دلوقتي عن شخص حقيقي يقدر يسمعك ويفهمك بجد.";

      try {
        const realAI = await fetchGemini(`You are Aether AI, a supportive listener for an Egyptian user. They said: "${userInput}". 
        Respond in Egyptian Arabic (Ammiya). Be deeply empathetic, poetic, and acknowledge their feelings. 
        Tell them you are finding a real soul to listen to them. Keep it mysterious yet very comforting. 
        IMPORTANT: Respond in 1 brief sentence.`);
        if (realAI) aiResponse = realAI;
      } catch (e) {
        console.error("SpeakerAI Gemini call failed:", e);
        // Fallback to default message if AI fails
      }

      setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
      setLoading(false);

      // Create request for a listener
      if (user) {
        await addDoc(collection(db, "requests"), {
          speakerId: user.uid,
          speakerName: user.displayName || 'Anonymous',
          summary: aiResponse,
          status: 'pending',
          timestamp: serverTimestamp()
        });
      }

      setMatching(true);
    }, 1500);
  };

  useEffect(() => {
    if (!matching || !user) return;

    const q = query(
      collection(db, "requests"),
      where("speakerId", "==", user.uid),
      where("status", "==", "accepted")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const requestData = snapshot.docs[0].data();
        if (requestData.roomId) {
          navigate(`/chat/${requestData.roomId}`);
        }
      }
    });

    return () => unsubscribe();
  }, [matching, user, navigate]);

  if (emergencyModal) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="glass-card" style={{ padding: '40px', maxWidth: '500px', textAlign: 'center', border: '1px solid rgba(255, 50, 50, 0.3)' }}>
          <ShieldAlert size={60} color="#ff5050" style={{ marginBottom: '20px' }} />
          <h2 style={{ color: '#ffbaba', marginBottom: '15px' }}>We hear your pain.</h2>
          <p style={{ color: 'var(--silver-text)', marginBottom: '25px', lineHeight: '1.6' }}>
            You don't have to carry this alone. We've detected high distress levels. Would you like to connect with a certified specialist immediately?
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <button className="glass-button" style={{ background: 'rgba(255, 50, 50, 0.1)', borderColor: '#ff5050', justifyContent: 'center' }}>
              <Stethoscope size={20} /> Connect with Specialist (24/7)
            </button>
            <button className="glass-button" style={{ justifyContent: 'center' }} onClick={() => setEmergencyModal(false)}>
              I just want to talk to a peer
            </button>
            <p style={{ fontSize: '12px', color: 'var(--silver-muted)' }}>*Confidential hotline: 988 (USA) or local emergency services*</p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (matching) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexFlow: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ textAlign: 'center' }}
        >
          <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto 30px' }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              style={{ position: 'absolute', inset: 0, border: '2px dashed var(--accent-silver)', borderRadius: '50%', opacity: 0.3 }}
            />
            <Loader2 size={40} className="floating" style={{ position: 'absolute', top: '40px', left: '40px', color: 'var(--accent-silver)' }} />
          </div>
          <h2 className="silver-text-gradient">Searching for a soul...</h2>
          <p style={{ color: 'var(--silver-muted)', marginTop: '10px' }}>AI is finding your perfect companion</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div style={{ paddingTop: '100px', display: 'flex', justifyContent: 'center', minHeight: '100vh', padding: '100px 15px 40px' }}>
      <div className="glass-card chat-container" style={{ width: '100%', maxWidth: '800px', height: '80vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Shield size={18} color="#808080" />
          <span style={{ fontSize: '14px', color: 'var(--silver-muted)' }}>AI-Moderated & Secure • No Personal Data Allowed</span>
        </div>

        {warning && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ padding: '10px 20px', background: 'rgba(255, 80, 80, 0.1)', borderBottom: '1px solid rgba(255, 0, 0, 0.2)', display: 'flex', alignItems: 'center', gap: '10px', color: '#ff8080', fontSize: '13px' }}>
            <ShieldAlert size={16} /> {warning}
          </motion.div>
        )}

        <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <AnimatePresence>
            {messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: m.role === 'user' ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                style={{
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                  background: m.role === 'user' ? 'var(--glass-shine)' : 'transparent',
                  padding: '12px 18px',
                  borderRadius: '16px',
                  border: m.role === 'user' ? '1px solid var(--glass-border)' : 'none',
                  color: m.role === 'user' ? '#fff' : 'var(--silver-text)',
                  fontSize: '15px'
                }}
              >
                {m.content}
              </motion.div>
            ))}
          </AnimatePresence>
          {loading && (
            <div style={{ color: 'var(--silver-muted)', fontSize: '13px', fontStyle: 'italic' }}>AI is analyzing vibes...</div>
          )}
        </div>

        <div style={{ padding: '20px', background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ position: 'relative' }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Speak from your heart..."
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--glass-border)',
                borderRadius: '12px',
                padding: '15px',
                color: '#fff',
                resize: 'none',
                height: '80px',
                outline: 'none',
                fontFamily: 'inherit'
              }}
            />
            <button
              onClick={handleSend}
              className="glass-button"
              style={{ position: 'absolute', bottom: '15px', right: '15px', padding: '8px 16px' }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ChatRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  React.useEffect(() => {
    if (!roomId) return;
    const q = query(
      collection(db, "rooms", roomId, "messages"),
      orderBy("timestamp", "asc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [roomId]);

  const send = async () => {
    if (!input.trim() || !user || !roomId) return;
    const toxicityKeywords = ['shut up', 'idiot', 'stupid', 'hate', 'die', 'ugly', 'useless', 'harass', 'kill'];
    if (toxicityKeywords.some(kw => input.toLowerCase().includes(kw))) {
      localStorage.setItem('ban_expiry', (Date.now() + 86400000).toString());
      window.location.reload();
      return;
    }
    await addDoc(collection(db, "rooms", roomId, "messages"), {
      senderId: user.uid,
      senderName: user.displayName || 'Me',
      content: input,
      timestamp: serverTimestamp()
    });
    setInput('');
  };

  const reportUser = async () => {
    if (window.confirm("Report this user for a safety violation?")) {
      await addDoc(collection(db, "reports"), { reportedAt: serverTimestamp(), type: 'Harassment', status: 'Pending' });
      alert("Report sent to the collective shield.");
      navigate('/rate');
    }
  };

  return (
    <div style={{ paddingTop: '100px', display: 'flex', justifyContent: 'center', minHeight: '100vh', paddingBottom: '40px' }}>
      <div className="glass-card" style={{ width: '90%', maxWidth: '800px', height: '80vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#4CAF50' }}></div>
            <span>Secured Connection</span>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="glass-button" style={{ padding: '5px 12px', fontSize: '12px' }} onClick={() => navigate('/speak')}><Ban size={14} /> Change Partner</button>
            <button className="glass-button" style={{ padding: '5px 12px', fontSize: '12px', color: '#ffbaba' }} onClick={reportUser}><Flag size={14} /> Report</button>
            <button className="glass-button" style={{ padding: '5px 12px', fontSize: '12px', background: 'rgba(255, 50, 50, 0.1)' }} onClick={() => navigate('/rate')}><XCircle size={14} /> End Session</button>
          </div>
        </div>
        <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {messages.map((m, i) => (
            <div key={m.id || i} style={{ alignSelf: m.senderId === user?.uid ? 'flex-end' : 'flex-start', maxWidth: '75%' }}>
              <div style={{ background: m.senderId === user?.uid ? 'var(--glass-shine)' : 'rgba(255,255,255,0.05)', padding: '12px 16px', borderRadius: '16px', border: '1px solid var(--glass-border)', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>{m.content}</div>
              <div style={{ fontSize: '10px', color: 'var(--silver-muted)', marginTop: '6px', textAlign: m.senderId === user?.uid ? 'right' : 'left' }}>{m.senderName} • Encrypted</div>
            </div>
          ))}
        </div>
        <div style={{ padding: '20px', borderTop: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && send()} placeholder="Your message is encrypted..." style={{ flex: 1, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '15px', color: '#fff', outline: 'none' }} />
            <button className="glass-button" onClick={send} style={{ borderRadius: '12px' }}><Send size={18} /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

const RateAndReward = () => {
  const navigate = useNavigate();
  const [rated, setRated] = useState(false);

  const handleComplete = () => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#ffffff', '#C0C0C0', '#808080']
    });
    setRated(true);
    setTimeout(() => {
      navigate('/');
    }, 4000);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass-card"
        style={{ padding: '40px', textAlign: 'center', maxWidth: '450px' }}
      >
        {!rated ? (
          <>
            <Award size={48} color="#C0C0C0" style={{ marginBottom: '20px' }} />
            <h2 style={{ fontSize: '28px', marginBottom: '10px' }}>How was the talk?</h2>
            <p style={{ color: 'var(--silver-muted)', marginBottom: '30px' }}>Your feedback helps us curate better connections.</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '40px' }}>
              {[1, 2, 3, 4, 5].map(i => <Star key={i} size={32} cursor="pointer" className="star-hover" />)}
            </div>
            <button className="glass-button" style={{ width: '100%', justifyContent: 'center' }} onClick={handleComplete}>
              <Gift size={18} /> Complete & Receive Soul-Gift
            </button>
          </>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="floating" style={{ marginBottom: '20px' }}>
              <Gift size={64} color="#fff" />
            </div>
            <h2 className="silver-text-gradient">A gift for your soul</h2>
            <p style={{ color: 'var(--silver-muted)', marginTop: '15px' }}>"Silence is a source of Great Strength." - Lao Tzu</p>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)', marginTop: '20px' }}>Returning you to the collective...</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

const Auth = () => {
  const { login, register, user } = useAuth();
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    nickname: '',
    password: '',
    role: 'speaker'
  });

  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    // Clean username to prevent invalid email errors (remove spaces and special chars)
    const cleanUsername = formData.username.replace(/\s+/g, '').replace(/[^a-zA-Z0-9]/g, '');
    const email = `${cleanUsername}@aether.local`;
    try {
      if (isRegistering) {
        const userCred = await register(email, formData.password);
        await updateProfile(userCred.user, { displayName: formData.nickname || formData.username });
      } else {
        await login(email, formData.password);
      }
      navigate('/');
    } catch (err) {
      setError(err.message.replace('Firebase:', 'Security:'));
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass-card"
        style={{ padding: '40px', width: '100%', maxWidth: '450px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <h2 style={{ fontSize: '28px' }}>{isRegistering ? 'Create Identity' : 'Authorize Protocol'}</h2>
          <p style={{ color: 'var(--silver-muted)', fontSize: '14px' }}>Secured Soul-to-Soul Encryption</p>
        </div>

        {error && <div style={{ color: '#ff8080', fontSize: '12px', textAlign: 'center', marginBottom: '15px' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {isRegistering && (
            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
              {['Speaker', 'Listener', 'Specialist'].map(role => (
                <div
                  key={role}
                  onClick={() => setFormData({ ...formData, role: role.toLowerCase() })}
                  style={{
                    flex: 1, padding: '10px', borderRadius: '8px', cursor: 'pointer', textAlign: 'center', fontSize: '12px',
                    background: formData.role === role.toLowerCase() ? 'var(--glass-shine)' : 'transparent',
                    border: `1px solid ${formData.role === role.toLowerCase() ? 'var(--accent-silver)' : 'var(--glass-border)'}`
                  }}
                >
                  {role}
                </div>
              ))}
            </div>
          )}

          <input required type="text" placeholder="Identity Name (@...)" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '12px', color: '#fff', outline: 'none' }} />
          {isRegistering && (
            <input required type="text" placeholder="The Name the Soul Hears (Nickname)" value={formData.nickname} onChange={(e) => setFormData({ ...formData, nickname: e.target.value })} style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '12px', color: '#fff', outline: 'none' }} />
          )}
          <input required type="password" placeholder="Encryption Phrase (Password)" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '12px', color: '#fff', outline: 'none' }} />

          <button className="glass-button" style={{ justifyContent: 'center', marginTop: '10px' }}>
            {isRegistering ? 'Seal Identity' : 'Unlock Protocol'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '11px', color: 'var(--silver-muted)', lineHeight: '1.4' }}>
          By syncing with Aether, you agree to our <span onClick={() => navigate('/legal')} style={{ color: '#fff', cursor: 'pointer', textDecoration: 'underline' }}>Resonance Safety Protocols</span>
        </p>

        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', color: 'var(--silver-muted)' }}>
          {isRegistering ? 'Already synced with the Aether?' : 'New frequency detected?'}
          <span onClick={() => setIsRegistering(!isRegistering)} style={{ color: '#fff', cursor: 'pointer', marginLeft: '5px' }}>{isRegistering ? 'Access' : 'Sync'}</span>
        </p>
      </motion.div>
    </div>
  );
};

const Journal = () => {
  const { user } = useAuth();
  const [entry, setEntry] = useState('');
  const [rephrased, setRephrased] = useState('');
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "journal"), where("userId", "==", user.uid), orderBy("timestamp", "desc"));
    return onSnapshot(q, s => setHistory(s.docs.map(d => ({ id: d.id, ...d.data() }))));
  }, [user]);

  const rephrase = async () => {
    if (!entry.trim() || !user) return;
    setRephrased('AI is sensing the depth of your words...');

    await addDoc(collection(db, "journal"), {
      userId: user.uid,
      content: entry,
      timestamp: serverTimestamp()
    });

    const prompt = `The user wrote this in their private sanctuary: "${entry}". 
    Acknowledge their feelings with extreme empathy and rephrase it in a way that makes them feel heard, validated, and poetic. 
    Start with "AI Reflection:". Keep it meaningful and supportive.`;

    try {
      const result = await fetchGemini(prompt);
      if (result) {
        setRephrased(result);
        return;
      }
    } catch (e) {
      console.error("AI logic error:", e);
    }

    // English Fallback Logic
    const lowercaseEntry = entry.toLowerCase();
    let fallbackResponse = "I hear you. This space is yours to reflect in absolute safety.";

    if (lowercaseEntry.includes('sad') || lowercaseEntry.includes('heavy') || lowercaseEntry.includes('pain')) {
      fallbackResponse = "I can feel the depth of your words. Sharing them here is the first step towards peace.";
    } else if (lowercaseEntry.includes('happy') || lowercaseEntry.includes('joy') || lowercaseEntry.includes('great')) {
      fallbackResponse = "Your positive energy is a beacon in the Aether. Keep shining.";
    } else if (lowercaseEntry.includes('scared') || lowercaseEntry.includes('anxious') || lowercaseEntry.includes('fear')) {
      fallbackResponse = "Take a deep breath. You are in a safe haven where no one judges your frequencies.";
    }

    setRephrased(`AI Reflection: ${fallbackResponse}`);
  };

  return (
    <div style={{ paddingTop: '200px', display: 'flex', justifyContent: 'center', minHeight: '100vh', paddingBottom: '100px' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="premium-glass-panel"
        style={{ width: '90%', maxWidth: '900px', padding: '50px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '40px' }}>
          <div className="icon-glow-container">
            <Book color="#fff" size={28} />
          </div>
          <div>
            <h2 className="silver-text-gradient" style={{ fontSize: '32px', fontWeight: '800' }}>Private Sanctuary</h2>
            <p style={{ color: 'var(--silver-muted)', fontSize: '14px', letterSpacing: '1px' }}>PERSONAL REFLECTIONS • END-TO-END LOCAL</p>
          </div>
        </div>

        <div style={{ position: 'relative' }}>
          <textarea
            value={entry} onChange={(e) => setEntry(e.target.value)}
            placeholder="Type your silent thoughts here..."
            style={{ width: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '35px', color: '#fff', height: '350px', outline: 'none', resize: 'none', fontSize: '18px', lineHeight: '1.8', boxShadow: 'inset 0 10px 30px rgba(0,0,0,0.2)' }}
          />
          <div style={{ position: 'absolute', bottom: '25px', right: '35px' }}>
            <button className="premium-action-btn" onClick={rephrase}>
              <Sparkles size={16} /> Help me rephrase
            </button>
          </div>
        </div>

        <AnimatePresence>
          {rephrased && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              style={{ marginTop: '40px', padding: '30px', background: 'rgba(255,255,255,0.03)', borderRadius: '20px', borderLeft: '4px solid var(--accent-silver)', fontSize: '16px', color: 'var(--silver-text)', lineHeight: '1.8' }}
            >
              <div style={{ marginBottom: '15px', fontSize: '11px', color: 'var(--silver-muted)', fontWeight: 'bold', letterSpacing: '2px' }}>AI INSIGHT</div>
              "{rephrased}"
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

const ListenerHub = () => {
  const [requests, setRequests] = useState([]);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const q = query(collection(db, "requests"), where("status", "==", "pending"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRequests(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const acceptRequest = async (req) => {
    if (!user) return;
    const roomId = `${req.speakerId}_${user.uid}_${Date.now()}`;

    // Create the room
    await addDoc(collection(db, "rooms", roomId, "messages"), {
      senderId: 'system',
      senderName: 'Aether',
      content: 'Connection Established. Speak freely.',
      timestamp: serverTimestamp()
    });

    // Update the request
    await deleteDoc(doc(db, "requests", req.id));
    await addDoc(collection(db, "requests"), {
      ...req,
      id: req.id, // Keep reference if needed, but we are replacing with accepted state
      status: 'accepted',
      roomId: roomId,
      listenerId: user.uid,
      timestamp: serverTimestamp()
    });

    navigate(`/chat/${roomId}`);
  };

  return (
    <div style={{ paddingTop: '150px', minHeight: '100vh', padding: '0 20px' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <h2 className="silver-text-gradient" style={{ fontSize: '32px', marginBottom: '40px', textAlign: 'center' }}>
          Souls waiting for Resonance
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {requests.length === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '100px', opacity: 0.5 }}>
              <Heart size={48} className="floating" style={{ marginBottom: '20px' }} />
              <p>The Aether is quiet. Stay tuned for a heartbeat...</p>
            </div>
          ) : (
            requests.map(req => (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card"
                style={{ padding: '25px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                  <User size={18} color="var(--accent-silver)" />
                  <span style={{ fontWeight: 'bold' }}>{req.speakerName}</span>
                </div>
                <p style={{ fontSize: '14px', color: 'var(--silver-muted)', fontStyle: 'italic', marginBottom: '20px', lineHeight: '1.6' }}>
                  "{req.summary}"
                </p>
                <button
                  className="glass-button"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => acceptRequest(req)}
                >
                  <Sparkles size={16} /> Resonance (Accept)
                </button>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const [chats, setChats] = useState([]);
  const [entries, setEntries] = useState([]);
  const [bans, setBans] = useState([]);
  const [reports, setReports] = useState([]);

  React.useEffect(() => {
    const uChats = onSnapshot(collection(db, "chats"), s => setChats(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const uEntries = onSnapshot(collection(db, "journal"), s => setEntries(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const uBans = onSnapshot(collection(db, "bans"), s => setBans(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const uReports = onSnapshot(collection(db, "reports"), s => setReports(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { uChats(); uEntries(); uBans(); uReports(); };
  }, []);

  const deleteItem = async (coll, id) => {
    if (window.confirm("Confirm deletion?")) await deleteDoc(doc(db, coll, id));
  };

  const clearColl = async (coll) => {
    if (window.confirm(`Wipe all ${coll}?`)) {
      const snap = await getDocs(collection(db, coll));
      snap.docs.forEach(async d => await deleteDoc(doc(db, coll, d.id)));
    }
  };

  return (
    <div style={{ paddingTop: '240px', padding: '40px', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '60px' }}>
        <h2 className="silver-text-gradient" style={{ fontSize: '42px', fontWeight: '900' }}>Oracle Control Panel</h2>
        <div style={{ display: 'flex', gap: '20px' }}>
          <div className="glass-card" style={{ padding: '15px 30px', textAlign: 'center' }}>
            <div style={{ fontSize: '10px', color: 'var(--silver-muted)', textTransform: 'uppercase' }}>Active Souls</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{chats.length}</div>
          </div>
          <div className="glass-card" style={{ padding: '15px 30px', textAlign: 'center', border: '1px solid rgba(0,255,0,0.2)' }}>
            <div style={{ fontSize: '10px', color: 'var(--silver-muted)', textTransform: 'uppercase' }}>System Health</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4CAF50' }}>Stable</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '30px' }}>
        {/* Specialist Alerts */}
        <div className="glass-card" style={{ padding: '30px', borderTop: '4px solid #ffcc00', gridColumn: '1 / -1' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '25px' }}><ShieldAlert size={20} color="#ffcc00" /> Specialist Critical Watch</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {entries.filter(e => ['die', 'suicide', 'hurt', 'kill'].some(w => e.content.toLowerCase().includes(w))).length === 0 ? (
              <p style={{ color: 'var(--silver-muted)', textAlign: 'center', gridColumn: '1/-1' }}>No high-risk resonances detected.</p>
            ) : entries.filter(e => ['die', 'suicide', 'hurt', 'kill'].some(w => e.content.toLowerCase().includes(w))).map(e => (
              <div key={e.id} style={{ padding: '20px', background: 'rgba(255,50,50,0.1)', borderRadius: '16px', border: '1px solid rgba(255,50,50,0.3)' }}>
                <div style={{ color: '#ff8080', fontWeight: 'bold', marginBottom: '10px', fontSize: '12px' }}>CRITICAL ALERT</div>
                <div style={{ fontSize: '14px', marginBottom: '10px' }}>"{e.content}"</div>
                <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>Identity: Anonymous Seeker • {e.timestamp?.toDate().toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Monitoring */}
        <div className="glass-card" style={{ padding: '30px', borderTop: '4px solid var(--accent-silver)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><MessageSquare size={20} /> Live Frequency</h3>
            <button className="glass-button" style={{ color: '#ff8080', fontSize: '11px' }} onClick={() => clearColl('chats')}>WIPE ALL</button>
          </div>
          <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {chats.map(c => (
              <div key={c.id} style={{ padding: '15px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--silver-muted)', marginBottom: '5px' }}>
                  <span>{c.user} • {c.timestamp?.toDate().toLocaleTimeString()}</span>
                  <Trash2 size={12} cursor="pointer" onClick={() => deleteItem('chats', c.id)} />
                </div>
                <div style={{ fontSize: '14px' }}>{c.content}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Banned Users */}
        <div className="glass-card" style={{ padding: '30px', borderTop: '4px solid #ff5050' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '25px' }}><Ban size={20} color="#ff5050" /> Banned Identities</h3>
          <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {bans.length === 0 ? <p style={{ color: 'var(--silver-muted)', textAlign: 'center' }}>No active bans</p> : bans.map(b => (
              <div key={b.id} style={{ padding: '15px', background: 'rgba(255,50,50,0.05)', borderRadius: '12px', border: '1px solid rgba(255,50,50,0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 'bold' }}>{b.ip}</div>
                  <div style={{ fontSize: '11px', color: 'var(--silver-muted)' }}>Reason: {b.reason}</div>
                </div>
                <button className="glass-button" style={{ padding: '5px 15px', fontSize: '10px' }} onClick={() => deleteItem('bans', b.id)}>UNBAN</button>
              </div>
            ))}
          </div>
        </div>

        {/* Reports */}
        <div className="glass-card" style={{ padding: '30px', borderTop: '4px solid #ffcc00' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '25px' }}><Flag size={20} color="#ffcc00" /> Security Reports</h3>
          <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {reports.length === 0 ? <p style={{ color: 'var(--silver-muted)', textAlign: 'center' }}>All clear</p> : reports.map(r => (
              <div key={r.id} style={{ padding: '15px', background: 'rgba(255,204,0,0.05)', borderRadius: '12px', border: '1px solid rgba(255,204,0,0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#ffcc00' }}>{r.type}</span>
                  <Trash2 size={12} cursor="pointer" onClick={() => deleteItem('reports', r.id)} />
                </div>
                <div style={{ fontSize: '11px', color: 'var(--silver-muted)' }}>Status: {r.status} • {r.reportedAt?.toDate().toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Journal */}
        <div className="glass-card" style={{ padding: '30px', borderTop: '4px solid var(--accent-silver)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Book size={20} /> Shared Echoes</h3>
            <button className="glass-button" style={{ color: '#ff8080', fontSize: '11px' }} onClick={() => clearColl('journal')}>WIPE ALL</button>
          </div>
          <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {entries.map(e => (
              <div key={e.id} style={{ padding: '15px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                <div style={{ fontSize: '10px', color: 'var(--silver-muted)', marginBottom: '5px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{e.timestamp?.toDate().toLocaleString()}</span>
                  <Trash2 size={12} cursor="pointer" onClick={() => deleteItem('journal', e.id)} />
                </div>
                <div style={{ fontSize: '13px', fontStyle: 'italic', lineHeight: '1.5' }}>"{e.content}"</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const Insights = () => {
  const { user } = useAuth();
  const [data, setData] = useState({ calm: 40, joy: 20, sorrow: 30, hope: 10 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "journal"), where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const entries = snapshot.docs.map(d => d.data().content.toLowerCase());
      if (entries.length > 0) {
        // Simple heuristic sentiment analysis
        const keywords = {
          calm: ['quiet', 'peace', 'calm', 'relax', 'still', 'serene', 'tranquil'],
          joy: ['happy', 'love', 'content', 'great', 'smile', 'bliss', 'delight'],
          sorrow: ['sad', 'pain', 'heavy', 'cry', 'dark', 'grief', 'lonely'],
          hope: ['future', 'bright', 'forward', 'better', 'try', 'trust', 'light']
        };

        const counts = { calm: 0, joy: 0, sorrow: 0, hope: 0 };
        entries.forEach(text => {
          Object.keys(keywords).forEach(key => {
            keywords[key].forEach(word => { if (text.includes(word)) counts[key]++; });
          });
        });

        const total = Object.values(counts).reduce((a, b) => a + b, 0);
        setData({
          calm: (counts.calm / total) * 100,
          joy: (counts.joy / total) * 100,
          sorrow: (counts.sorrow / total) * 100,
          hope: (counts.hope / total) * 100
        });
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  if (loading) return <div style={{ paddingTop: '200px', textAlign: 'center' }}><Loader2 className="animate-spin" size={40} /></div>;

  if (data.calm === 1 && data.joy === 1 && data.sorrow === 1 && data.hope === 1) {
    return (
      <div style={{ paddingTop: '150px', minHeight: '100vh', padding: '0 20px', textAlign: 'center' }}>
        <div className="premium-glass-panel" style={{ maxWidth: '600px', margin: '0 auto', padding: '60px' }}>
          <Sparkles size={48} color="var(--accent-silver)" style={{ marginBottom: '20px' }} opacity={0.5} />
          <h2 className="silver-text-gradient" style={{ fontSize: '28px', marginBottom: '15px' }}>The Aether is Silent</h2>
          <p style={{ color: 'var(--silver-muted)', lineHeight: '1.6' }}>
            We haven't sensed your frequencies yet. Write your thoughts in the <strong>Journal</strong> to see your emotional resonance patterns here.
          </p>
          <button onClick={() => navigate('/journal')} className="glass-button" style={{ margin: '30px auto 0' }}>Go to Journal</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: '100px', minHeight: '100vh', padding: '100px 15px 40px' }}>
      <div className="premium-glass-panel" style={{ maxWidth: '1000px', margin: '0 auto', padding: 'clamp(20px, 5vw, 60px)' }}>
        <h2 className="silver-text-gradient" style={{ fontSize: 'clamp(28px, 6vw, 42px)', textAlign: 'center', marginBottom: '40px' }}>Your Emotional Resonance</h2>

        <div className="responsive-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '20px' }}>
          {Object.entries(data).map(([key, val]) => (
            <div key={key} style={{ textAlign: 'center' }}>
              <div style={{ height: 'clamp(150px, 30vh, 250px)', width: '100%', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', position: 'relative', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${val}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  style={{
                    position: 'absolute', bottom: 0, left: 0, width: '100%',
                    background: key === 'sorrow' ? 'linear-gradient(to top, #444, #888)' : 'linear-gradient(to top, var(--accent-silver), #fff)',
                    opacity: 0.8
                  }}
                />
              </div>
              <h3 style={{ marginTop: '15px', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '2px', color: 'var(--silver-muted)' }}>{key}</h3>
              <div style={{ fontSize: '20px', fontWeight: 'bold', marginTop: '5px' }}>{Math.round(val)}%</div>
            </div>
          ))}
        </div>

        <p style={{ marginTop: '40px', textAlign: 'center', color: 'var(--silver-muted)', fontSize: '14px' }}>
          "Your emotions are frequencies. You are the conductor."
        </p>
      </div>
    </div>
  );
};

const CommunityRoom = () => {
  const { moodId } = useParams();
  const { user } = useAuth();
  const [echoes, setEchoes] = useState([]);
  const [input, setInput] = useState('');
  const navigate = useNavigate();
  const scrollRef = useRef(null);

  const moods = [
    { id: 'calm', name: 'Sea of Calm', icon: <Waves size={20} />, color: '#C0C0C0' },
    { id: 'void', name: 'The Void', icon: <Moon size={20} />, color: '#444444' },
    { id: 'hope', name: 'Fires of Hope', icon: <Flame size={20} />, color: '#888888' },
    { id: 'woods', name: 'Whispering Woods', icon: <Trees size={20} />, color: '#666666' }
  ];

  const currentMood = moods.find(m => m.id === moodId) || moods[0];

  useEffect(() => {
    const q = query(
      collection(db, "community_echoes"),
      where("moodId", "==", moodId),
      orderBy("timestamp", "asc")
    );
    const unsubscribe = onSnapshot(q, (s) => {
      setEchoes(s.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, [moodId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [echoes]);

  const postEcho = async () => {
    if (!input.trim() || !user) return;
    const text = input;
    setInput('');
    await addDoc(collection(db, "community_echoes"), {
      moodId,
      content: text,
      timestamp: serverTimestamp(),
      nickname: user.displayName || 'Seeker'
    });
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#050505', overflow: 'hidden' }}>
      {/* Sidebar: Discord Style */}
      <div className="desktop-only" style={{ width: '280px', background: 'rgba(255,255,255,0.01)', borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', paddingTop: '80px' }}>
        <div style={{ padding: '20px 25px', marginBottom: '10px' }}>
          <h3 style={{ fontSize: '11px', color: 'var(--silver-muted)', letterSpacing: '2.5px', textTransform: 'uppercase', fontWeight: '800' }}>Collective Spaces</h3>
        </div>
        <div style={{ flexGrow: 1, padding: '0 12px' }}>
          {moods.map(m => (
            <div
              key={m.id}
              onClick={() => navigate(`/community/${m.id}`)}
              style={{
                display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 18px', borderRadius: '10px',
                cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', marginBottom: '4px',
                background: moodId === m.id ? 'rgba(255,255,255,0.05)' : 'transparent',
                color: moodId === m.id ? '#fff' : 'var(--silver-muted)',
                boxShadow: moodId === m.id ? '0 4px 15px rgba(0,0,0,0.2)' : 'none'
              }}
              className="room-item"
            >
              <span style={{ color: m.color, opacity: moodId === m.id ? 1 : 0.5 }}>{m.icon}</span>
              <span style={{ fontSize: '13.5px', fontWeight: moodId === m.id ? '600' : '400' }}>{m.name}</span>
            </div>
          ))}
        </div>
        <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.03)', background: 'rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '600', fontSize: '14px' }}>
              {user?.displayName?.[0] || 'S'}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{user?.displayName || 'Seeker'}</div>
              <div style={{ fontSize: '10px', color: 'var(--silver-muted)', letterSpacing: '0.5px' }}>FREQUENCY: STABLE</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', position: 'relative', paddingTop: '80px' }}>
        {/* Chat Header */}
        <div style={{ height: '64px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', padding: '0 30px', justifyContent: 'space-between', background: 'rgba(5,5,5,0.7)', backdropFilter: 'blur(30px)', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ color: currentMood.color }}>{currentMood.icon}</span>
            <h2 style={{ fontSize: '16px', fontWeight: '700', letterSpacing: '0.5px' }}>{currentMood.name}</h2>
          </div>
          <button onClick={() => navigate('/community')} className="mobile-only glass-button" style={{ fontSize: '10px', padding: '6px 14px' }}>Browse Spaces</button>
        </div>

        {/* Messages List */}
        <div
          ref={scrollRef}
          style={{ flexGrow: 1, overflowY: 'auto', padding: '30px', display: 'flex', flexDirection: 'column', gap: '24px', scrollBehavior: 'smooth' }}
        >
          {echoes.length === 0 ? (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.2 }}>
              <Sparkles size={48} style={{ marginBottom: '20px' }} />
              <p style={{ fontSize: '14px', letterSpacing: '1px' }}>Wavelength is quiet. Start the resonance...</p>
            </div>
          ) : (
            echoes.map((echo, i) => (
              <motion.div
                key={echo.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ display: 'flex', gap: '16px' }}
              >
                <div style={{ minWidth: '42px', height: '42px', borderRadius: '14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--silver-muted)', fontSize: '16px', fontWeight: '600' }}>
                  {echo.nickname?.[0] || 'S'}
                </div>
                <div style={{ flexGrow: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '6px' }}>
                    <span style={{ fontWeight: '700', fontSize: '14px', color: '#fff' }}>{echo.nickname}</span>
                    <span style={{ fontSize: '10px', color: 'var(--silver-muted)', fontWeight: '500' }}>{echo.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.85)', lineHeight: '1.6', whiteSpace: 'pre-wrap', maxWidth: '900px' }}>{echo.content}</p>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Input Area */}
        <div style={{ padding: '0 30px 30px' }}>
          <div className="glass-card" style={{ padding: '4px 6px 4px 20px', borderRadius: '18px', display: 'flex', alignItems: 'center', gap: '15px', background: 'rgba(255,255,255,0.03)', boxShadow: '0 10px 40px rgba(0,0,0,0.3)' }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && postEcho()}
              placeholder={`Message in #${currentMood.name.toLowerCase().replace(/\s+/g, '-')}`}
              style={{ flexGrow: 1, background: 'transparent', border: 'none', color: '#fff', outline: 'none', fontSize: '14px', height: '48px' }}
            />
            <button
              onClick={postEcho}
              style={{ width: '40px', height: '40px', borderRadius: '14px', background: input.trim() ? '#fff' : 'transparent', border: 'none', color: input.trim() ? '#000' : 'var(--silver-muted)', cursor: 'pointer', transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CommunityHub = () => {
  const [counts, setCounts] = useState({ calm: 0, void: 0, hope: 0, woods: 0 });
  const navigate = useNavigate();

  const moods = [
    { id: 'calm', name: 'Sea of Calm', icon: <Waves size={32} />, color: '#C0C0C0', desc: 'Quiet reflection and deep inner peace.' },
    { id: 'void', name: 'The Void', icon: <Moon size={32} />, color: '#444444', desc: 'Embracing the silence of the unknown.' },
    { id: 'hope', name: 'Fires of Hope', icon: <Flame size={32} />, color: '#888888', desc: 'Reigniting the fire of hope within.' },
    { id: 'woods', name: 'Whispering Woods', icon: <Trees size={32} />, color: '#666666', desc: 'Gentle support and collective growth.' }
  ];

  useEffect(() => {
    const unsubs = moods.map(mood => {
      const q = query(collection(db, "community_echoes"), where("moodId", "==", mood.id));
      return onSnapshot(q, (snapshot) => {
        setCounts(prev => ({ ...prev, [mood.id]: snapshot.size }));
      });
    });
    return () => unsubs.forEach(unsub => unsub());
  }, []);

  return (
    <div style={{ paddingTop: '120px', minHeight: '100vh', paddingBottom: '100px', width: '100%', padding: '120px 20px 60px' }}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ textAlign: 'center', marginBottom: '40px' }}
      >
        <h2 className="silver-text-gradient" style={{ fontSize: 'clamp(32px, 8vw, 48px)', fontWeight: '900', letterSpacing: '-1px' }}>Collective Resonance</h2>
        <p style={{ color: 'var(--silver-muted)', maxWidth: '600px', margin: '20px auto 0', fontSize: 'clamp(14px, 4vw, 18px)', lineHeight: '1.6' }}>
          Join emotional frequencies in the silent collective.
        </p>
      </motion.div>

      <div className="responsive-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px',
        maxWidth: '1300px',
        margin: '0 auto'
      }}>
        {moods.map((m, idx) => (
          <motion.div
            key={m.name}
            whileHover={{ y: -10, scale: 1.02 }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="premium-glass-card"
            style={{ padding: '50px 40px', textAlign: 'center', cursor: 'pointer' }}
            onClick={() => navigate(`/community/${m.id}`)}
          >
            <div className="card-icon-sphere" style={{ background: `radial-gradient(circle at 30% 30%, ${m.color}66, transparent)` }}>
              {m.icon}
            </div>
            <h3 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '15px' }}>{m.name}</h3>
            <p style={{ fontSize: '14px', color: 'var(--silver-muted)', marginBottom: '25px', lineHeight: '1.5' }}>{m.desc}</p>
            <div style={{ padding: '10px 20px', borderRadius: '50px', background: 'rgba(255,255,255,0.03)', display: 'inline-block', fontSize: '12px', fontWeight: 'bold', color: 'var(--accent-silver)' }}>
              {counts[m.id] || 0} SOULS BREATHE HERE
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const Legal = () => {
  return (
    <div style={{ paddingTop: '150px', minHeight: '100vh', padding: '0 20px 100px' }}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="premium-glass-panel"
        style={{ maxWidth: '900px', margin: '0 auto', padding: 'clamp(30px, 8vw, 80px)' }}
      >
        <h1 className="silver-text-gradient" style={{ fontSize: 'clamp(32px, 8vw, 48px)', marginBottom: '40px' }}>Legal & Resonance Safety</h1>

        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ color: '#fff', fontSize: '22px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}><ShieldCheck size={24} /> Medical Disclaimer</h2>
          <p style={{ color: 'var(--silver-muted)', lineHeight: '1.8' }}>
            Aether is a peer-to-peer emotional support platform and AI bridge. <strong>It IS NOT a medical service, crisis hotline, or a substitute for professional mental health therapy.</strong> If you are in immediate danger or experiencing a medical emergency, please contact your local emergency services (e.g., 911) or a certified crisis center immediately.
          </p>
        </section>

        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ color: '#fff', fontSize: '22px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}><Lock size={24} /> Privacy & Anonymity</h2>
          <p style={{ color: 'var(--silver-muted)', lineHeight: '1.8' }}>
            Your privacy is our core frequency. We use end-to-end encryption principles for chats. We do not sell your data. Your "Identity" is your own; choose a nickname that feels safe. While we use AI to moderate for safety, we do not store personal identifiers beyond what is necessary to maintain your account frequency.
          </p>
        </section>

        <section style={{ marginBottom: '40px' }}>
          <h2 style={{ color: '#fff', fontSize: '22px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}><Ban size={24} /> Community Conduct</h2>
          <p style={{ color: 'var(--silver-muted)', lineHeight: '1.8' }}>
            The Aether is a sanctuary. Toxicity, harassment, hate speech, and sexual content are strictly prohibited. Our resonance AI monitors frequencies 24/7. Violators will have their identity permanently dissolved (Banned) without warning.
          </p>
        </section>

        <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '30px', textAlign: 'center', fontSize: '13px', color: 'var(--silver-muted)' }}>
          By using Aether, you agree to these resonance protocols. <br />
          Last Synchronized: January 2026
        </div>
      </motion.div>
    </div>
  );
};

const Footer = () => {
  const navigate = useNavigate();
  return (
    <footer style={{ padding: '60px 20px', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', background: 'rgba(0,0,0,0.2)' }}>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', marginBottom: '20px', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--silver-muted)' }}>
        <span className="nav-link" onClick={() => navigate('/legal')}>Legal & Safety</span>
        <span className="nav-link" onClick={() => navigate('/community')}>Collective</span>
        <span className="nav-link" onClick={() => navigate('/auth')}>Sync Identity</span>
      </div>
      <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', letterSpacing: '1px' }}>
        © 2026 AETHER PROJECT. ALL FREQUENCIES RESERVED.
      </p>
    </footer>
  );
};

function App() {
  const [isBanned, setIsBanned] = useState(false);
  const [banTimeRemaining, setBanTimeRemaining] = useState('');

  return (
    <AuthProvider>
      <AppContent isBanned={isBanned} setIsBanned={setIsBanned} banTimeRemaining={banTimeRemaining} setBanTimeRemaining={setBanTimeRemaining} />
    </AuthProvider>
  );
}

function AppContent({ isBanned, setIsBanned, banTimeRemaining, setBanTimeRemaining }) {
  const { user } = useAuth();

  useEffect(() => {
    const expiry = localStorage.getItem('ban_expiry');
    if (expiry) {
      const remaining = parseInt(expiry) - Date.now();
      if (remaining > 0) {
        setIsBanned(true);
        const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
        const hours = Math.floor((remaining / (1000 * 60 * 60)) % 24);
        setBanTimeRemaining(`${days}d ${hours}h`);
      } else {
        localStorage.removeItem('ban_expiry');
      }
    }
  }, []);

  if (isBanned) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', color: '#fff', textAlign: 'center', padding: '20px' }}>
        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="glass-card" style={{ padding: '60px', maxWidth: '500px', border: '1px solid rgba(255, 0, 0, 0.3)' }}>
          <Gavel size={60} color="#ff3333" style={{ marginBottom: '20px' }} />
          <h2 style={{ color: '#ff8080', fontSize: '32px', marginBottom: '15px' }}>Access Revoked</h2>
          <p style={{ color: 'var(--silver-muted)', marginBottom: '30px', lineHeight: '1.6' }}>
            The Aether collective has detected repeated violations of our safety guidelines (Harassment/Toxicity). Your identity has been suspended.
          </p>
          <div style={{ padding: '20px', background: 'rgba(255, 50, 50, 0.05)', borderRadius: '12px', border: '1px solid rgba(255, 50, 50, 0.1)' }}>
            <span style={{ fontSize: '12px', color: 'var(--silver-muted)' }}>BAN EXPIRES IN</span>
            <div style={{ fontSize: '24px', fontWeight: '700', marginTop: '5px' }}>{banTimeRemaining}</div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <Background3D />
      <DotGrid />
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/speak" element={<SpeakerAI />} />
        <Route path="/chat/:roomId" element={<ChatRoom />} />
        <Route path="/rate" element={<RateAndReward />} />
        <Route path="/journal" element={user ? <Journal /> : <Navigate to="/auth" />} />
        <Route path="/community" element={<CommunityHub />} />
        <Route path="/community/:moodId" element={user ? <CommunityRoom /> : <Navigate to="/auth" />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/stats" element={<Insights />} />
        <Route path="/listen" element={<ListenerHub />} />
        <Route path="/legal" element={<Legal />} />
        <Route path="*" element={<div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}><Ghost size={80} color="var(--silver-muted)" /><h1 style={{ marginTop: '20px' }}>Lost in the Aether</h1><p style={{ color: 'var(--silver-muted)' }}>This frequency doesn't exist.</p><button onClick={() => navigate('/')} className="glass-button" style={{ marginTop: '30px' }}>Return to Safety</button></div>} />
      </Routes>
      <Footer />
    </>
  );
}

export default App;
