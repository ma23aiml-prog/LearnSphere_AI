import { useState, useEffect, useRef } from "react";
import "./App.css";
import Login from "./Login";

const API = "https://learnsphere-ai-qzkh.onrender.com";

function Toast({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span>{t.type === "success" ? "✓" : "✕"}</span>
          {t.message}
        </div>
      ))}
    </div>
  );
}

function App() {
  const [email, setEmail] = useState(localStorage.getItem("userEmail") || "");
  const [userName, setUserName] = useState(localStorage.getItem("userName") || "");
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("token"));
  const [activePage, setActivePage] = useState("Dashboard");

  // Chat state — full message thread
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const chatEndRef = useRef(null);

  // Documents
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Chat history (from backend)
  const [chatHistory, setChatHistory] = useState([]);
  const [clearingHistory, setClearingHistory] = useState(false);

  // Profile
  const [profile, setProfile] = useState(null);

  // Quiz
  const [quiz, setQuiz] = useState(null);
  const [quizLoading, setQuizLoading] = useState(false);

  // Flashcards
  const [flashcards, setFlashcards] = useState(null);
  const [flashLoading, setFlashLoading] = useState(false);

  // Summary
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Selected document for quiz/flashcards/summary
  const [selectedDoc, setSelectedDoc] = useState("");

  // Progress Tracker
  const [progress, setProgress] = useState(null);
  const [progressLoading, setProgressLoading] = useState(false);

  // Study Plan
  const [studyPlan, setStudyPlan] = useState(null);
  const [studyPlanLoading, setStudyPlanLoading] = useState(false);

  // Theme
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved !== "light";
  });

  // Mobile sidebar
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Name editing
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [savingName, setSavingName] = useState(false);

  // Document search
  const [searchQuery, setSearchQuery] = useState("");

  // Toasts
  const [toasts, setToasts] = useState([]);

  // =========================================================
  // TOAST
  // =========================================================
  const addToast = (message, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  };

  // =========================================================
  // AUTH
  // =========================================================
  const getToken = () => localStorage.getItem("token");

  const handleLogin = (userEmail, name) => {
    localStorage.setItem("userEmail", userEmail);
    if (name) localStorage.setItem("userName", name);
    setEmail(userEmail);
    setUserName(name || "");
    setIsLoggedIn(true);
    setActivePage("Dashboard");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    setEmail("");
    setUserName("");
    setIsLoggedIn(false);
    setMessages([]);
    setDocuments([]);
    setChatHistory([]);
    setProfile(null);
    setActivePage("Dashboard");
  };

  // =========================================================
  // FETCH DOCUMENTS
  // =========================================================
  const fetchDocuments = async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API}/api/files`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { handleLogout(); return; }
      const data = await res.json();
      if (res.ok) setDocuments(data.files || []);
    } catch (e) {
      console.error("Fetch docs error:", e);
    }
  };

  // =========================================================
  // FETCH CHAT HISTORY
  // =========================================================
  const fetchChatHistory = async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API}/api/chat/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { handleLogout(); return; }
      const data = await res.json();
      if (res.ok) setChatHistory(data.history || []);
    } catch (e) {
      console.error("Fetch history error:", e);
    }
  };

  // =========================================================
  // FETCH PROFILE
  // =========================================================
  const fetchProfile = async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API}/api/user/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        if (data.name) {
          setUserName(data.name);
          localStorage.setItem("userName", data.name);
        }
      }
    } catch (e) {
      console.error("Fetch profile error:", e);
    }
  };

  // =========================================================
  // FETCH PROGRESS
  // =========================================================
  const fetchProgress = async () => {
    const token = getToken();
    if (!token) return;
    setProgressLoading(true);
    try {
      const res = await fetch(`${API}/api/quiz/progress`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProgress(data);
      }
    } catch (e) {
      console.error("Fetch progress error:", e);
    } finally {
      setProgressLoading(false);
    }
  };

  // =========================================================
  // SAVE QUIZ RESULT
  // =========================================================
  const saveQuizResult = async (finishedQuiz) => {
    const token = getToken();
    if (!token) return;
    try {
      await fetch(`${API}/api/quiz/result`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          score: finishedQuiz.score,
          total: finishedQuiz.questions.length,
          filename: selectedDoc || null,
          questions: finishedQuiz.questions,
        }),
      });
    } catch (e) {
      console.error("Save result error:", e);
    }
  };

  // =========================================================
  // LOAD ON LOGIN
  // =========================================================
  useEffect(() => {
    if (isLoggedIn) {
      fetchDocuments();
      fetchChatHistory();
      fetchProfile();
      fetchProgress();
    }
  }, [isLoggedIn]);

  // =========================================================
  // SCROLL CHAT TO BOTTOM
  // =========================================================
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, asking]);

  // =========================================================
  // FILE UPLOAD
  // =========================================================
  const processUpload = async (file) => {
    if (!file) return;
    if (file.type !== "application/pdf") {
      addToast("Please upload a PDF file.", "error");
      return;
    }
    const token = getToken();
    if (!token) { addToast("Please login again.", "error"); return; }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API}/api/files/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (res.status === 401) { handleLogout(); return; }
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || data.error || "Upload failed");
      addToast(`✓ ${file.name} uploaded successfully`);
      await fetchDocuments();
    } catch (e) {
      addToast(e.message || "Upload failed.", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleUpload = (e) => processUpload(e.target.files[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    processUpload(e.dataTransfer.files[0]);
  };

  // =========================================================
  // DELETE DOCUMENT
  // =========================================================
  const handleDelete = async (fileId) => {
    const token = getToken();
    if (!token) return;
    setDeletingId(fileId);
    try {
      const res = await fetch(`${API}/api/files/delete`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ file_id: fileId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Delete failed");
      addToast("Document deleted.");
      await fetchDocuments();
    } catch (e) {
      addToast(e.message || "Could not delete.", "error");
    } finally {
      setDeletingId(null);
    }
  };

  // =========================================================
  // ASK AI
  // =========================================================
  const handleAsk = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    const token = getToken();
    if (!token) { addToast("Please login again.", "error"); return; }

    const userMsg = { role: "user", text: question.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setQuestion("");
    setAsking(true);

    try {
      const res = await fetch(`${API}/api/chat/ask`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ question: userMsg.text }),
      });
      if (res.status === 401) { handleLogout(); return; }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to get answer");
      setMessages((prev) => [...prev, { role: "ai", text: data.answer }]);
      // Refresh history count
      setChatHistory((prev) => [...prev, { question: userMsg.text, answer: data.answer }]);
    } catch (e) {
      setMessages((prev) => [...prev, { role: "ai", text: `Error: ${e.message}`, isError: true }]);
    } finally {
      setAsking(false);
    }
  };

  // =========================================================
  // GENERATE QUIZ
  // =========================================================
  const handleGenerateQuiz = async () => {
    const token = getToken();
    if (!token) return;
    setQuizLoading(true);
    setQuiz(null);
    try {
      const res = await fetch(`${API}/api/quiz/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ filename: selectedDoc || undefined, count: 5 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setQuiz({ questions: data.questions, current: 0, score: 0, finished: false, answers: [] });
    } catch (e) {
      addToast(e.message, "error");
    } finally {
      setQuizLoading(false);
    }
  };

  // ANSWER QUIZ QUESTION
  const handleAnswer = (option) => {
    if (!quiz || quiz.finished) return;
    const q = quiz.questions[quiz.current];
    const correct = option === q.answer;
    const newAnswers = [...quiz.answers, { selected: option, correct, explanation: q.explanation }];
    const newScore = quiz.score + (correct ? 1 : 0);
    const next = quiz.current + 1;
    const finished = next >= quiz.questions.length;
    const updatedQuiz = { ...quiz, current: next, score: newScore, finished, answers: newAnswers };
    setQuiz(updatedQuiz);
    // Auto-save when quiz is complete
    if (finished) {
      saveQuizResult(updatedQuiz).then(() => fetchProgress());
    }
  };

  // RESTART QUIZ
  const restartQuiz = () => setQuiz(null);

  // =========================================================
  // GENERATE FLASHCARDS
  // =========================================================
  const handleGenerateFlashcards = async () => {
    const token = getToken();
    if (!token) return;
    setFlashLoading(true);
    setFlashcards(null);
    try {
      const res = await fetch(`${API}/api/quiz/flashcards`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ filename: selectedDoc || undefined, count: 8 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setFlashcards({ cards: data.cards, current: 0, flipped: false });
    } catch (e) {
      addToast(e.message, "error");
    } finally {
      setFlashLoading(false);
    }
  };

  // =========================================================
  // GENERATE SUMMARY
  // =========================================================
  const handleGenerateSummary = async (filename) => {
    const token = getToken();
    if (!token) return;
    setSummaryLoading(true);
    setSummary(null);
    setActivePage("Summary");
    try {
      const res = await fetch(`${API}/api/quiz/summary`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ filename: filename || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setSummary({ text: data.summary, filename: data.filename });
    } catch (e) {
      addToast(e.message, "error");
      setActivePage("Documents");
    } finally {
      setSummaryLoading(false);
    }
  };

  // =========================================================
  // CLEAR CHAT HISTORY
  // =========================================================
  const handleClearHistory = async () => {
    const token = getToken();
    if (!token) return;
    setClearingHistory(true);
    try {
      const res = await fetch(`${API}/api/chat/history`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to clear");
      setChatHistory([]);
      addToast("Chat history cleared.");
    } catch (e) {
      addToast(e.message || "Could not clear history.", "error");
    } finally {
      setClearingHistory(false);
    }
  };

  // =========================================================
  // HELPERS
  // =========================================================
  const formatDate = (date) => {
    if (!date) return "";
    try { return new Date(date).toLocaleString(); } catch { return ""; }
  };

  const displayName = userName || email.split("@")[0] || "User";
  const avatarLetter = (userName || email).charAt(0).toUpperCase();

  // Apply theme to body
  useEffect(() => {
    if (isDark) {
      document.body.classList.remove("light-mode");
      localStorage.setItem("theme", "dark");
    } else {
      document.body.classList.add("light-mode");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  // =========================================================
  // UPDATE NAME
  // =========================================================
  const handleUpdateName = async () => {
    if (!nameInput.trim()) return;
    const token = getToken();
    if (!token) return;
    setSavingName(true);
    try {
      const res = await fetch(`${API}/api/user/name`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: nameInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setUserName(data.name);
      localStorage.setItem("userName", data.name);
      setEditingName(false);
      addToast(`Name updated to "${data.name}"`);
    } catch (e) {
      addToast(e.message, "error");
    } finally {
      setSavingName(false);
    }
  };

  // =========================================================
  // GENERATE STUDY PLAN
  // =========================================================
  const handleGenerateStudyPlan = async () => {
    const token = getToken();
    if (!token) return;
    setStudyPlanLoading(true);
    setStudyPlan(null);
    try {
      const res = await fetch(`${API}/api/quiz/study-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ filename: selectedDoc || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setStudyPlan(data);
    } catch (e) {
      addToast(e.message, "error");
    } finally {
      setStudyPlanLoading(false);
    }
  };

  // =========================================================
  // EXPORT QUIZ AS PDF
  // =========================================================
  const exportQuizPDF = () => {
    if (!quiz) return;
    const win = window.open("", "_blank");
    const rows = quiz.answers.map((a, i) => `
      <tr style="background:${i % 2 === 0 ? '#f7f8fc' : '#fff'}">
        <td style="padding:10px;border-bottom:1px solid #eee">${quiz.questions[i].question}</td>
        <td style="padding:10px;border-bottom:1px solid #eee;color:${a.correct ? '#16a34a' : '#dc2626'}">${a.selected}</td>
        <td style="padding:10px;border-bottom:1px solid #eee;color:#16a34a">${quiz.questions[i].answer}</td>
        <td style="padding:10px;border-bottom:1px solid #eee">${a.correct ? '✓' : '✗'}</td>
      </tr>`).join("");
    win.document.write(`<html><head><title>LearnSphere Quiz Results</title>
      <style>body{font-family:sans-serif;padding:32px;color:#1a1d2e}
      h1{color:#5247d6}table{width:100%;border-collapse:collapse}th{background:#5247d6;color:#fff;padding:10px;text-align:left}
      @media print{button{display:none}}</style></head><body>
      <h1>LearnSphere AI — Quiz Results</h1>
      <p>Score: <strong>${quiz.score}/${quiz.questions.length}</strong> (${Math.round((quiz.score/quiz.questions.length)*100)}%)</p>
      <table><tr><th>Question</th><th>Your Answer</th><th>Correct Answer</th><th>Result</th></tr>${rows}</table>
      <br/><button onclick="window.print()">Print / Save PDF</button>
      </body></html>`);
    win.document.close();
  };

  // =========================================================
  // LOGIN SCREEN
  // =========================================================
  if (!isLoggedIn) return <Login onLogin={handleLogin} />;

  // =========================================================
  // APP SHELL
  // =========================================================
  return (
    <div className="app">
      <Toast toasts={toasts} />

      {/* Mobile overlay */}
      <div className={`sidebar-overlay ${sidebarOpen ? "open" : ""}`} onClick={() => setSidebarOpen(false)} />

      {/* Theme toggle */}
      <button className="theme-toggle" onClick={() => setIsDark(!isDark)} title="Toggle theme">
        {isDark ? "☀" : "🌙"}
      </button>

      {/* SIDEBAR */}
      <aside className={`sidebar ${sidebarOpen ? "mobile-open" : ""}`}>
        <div className="sidebar-logo">
          <div className="logo-box">L</div>
          <div>
            <h2>LearnSphere</h2>
            <span>AI Learning</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {["Dashboard", "Documents", "AI Chat", "History", "Quiz", "Flashcards", "Summary", "Study Plan", "Progress", "Profile"].map((page) => (
            <button
              key={page}
              className={`nav-item ${activePage === page ? "active" : ""}`}
              onClick={() => { setActivePage(page); setSidebarOpen(false); }}
            >
              <span className="nav-icon">
                {page === "Dashboard"  && "⌂"}
                {page === "Documents"  && "▣"}
                {page === "AI Chat"    && "✦"}
                {page === "History"    && "◷"}
                {page === "Quiz"       && "❓"}
                {page === "Flashcards" && "🃏"}
                {page === "Summary"    && "📋"}
                {page === "Study Plan" && "📅"}
                {page === "Progress"   && "📈"}
                {page === "Profile"    && "●"}
              </span>
              {page}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="user-mini">
            <div className="user-avatar">{avatarLetter}</div>
            <div className="user-info">
              <strong>{displayName}</strong>
              <span>Student</span>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>⇥ Logout</button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="main-content">
        {/* TOPBAR */}
        <header className="topbar">
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button className="hamburger" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
            <div>
              <h1>
                {activePage === "Dashboard"  && "Welcome back 👋"}
                {activePage === "Documents"  && "My Documents"}
                {activePage === "AI Chat"    && "AI Learning Assistant"}
                {activePage === "History"    && "Chat History"}
                {activePage === "Quiz"       && "Quiz Mode"}
                {activePage === "Flashcards" && "Flashcard Mode"}
                {activePage === "Summary"    && "Document Summary"}
                {activePage === "Study Plan" && "Study Plan"}
                {activePage === "Progress"   && "My Progress"}
                {activePage === "Profile"    && "My Profile"}
              </h1>
              <p>
                {activePage === "Dashboard"  && "Continue your personalized learning journey."}
                {activePage === "Documents"  && "Manage your uploaded learning materials."}
                {activePage === "AI Chat"    && "Ask questions from your uploaded documents."}
                {activePage === "History"    && "Review your previous AI conversations."}
                {activePage === "Quiz"       && "Test your knowledge from your uploaded notes."}
                {activePage === "Flashcards" && "Review key concepts with AI-generated flashcards."}
                {activePage === "Summary"    && "AI-generated summary of your document."}
                {activePage === "Study Plan" && "AI-generated 7-day revision schedule from your notes."}
                {activePage === "Progress"   && "Track your quiz scores and improvement over time."}
                {activePage === "Profile"    && "Manage your LearnSphere account."}
              </p>
            </div>
          </div>
          <div className="topbar-user">
            <div className="top-avatar">{avatarLetter}</div>
            <span>{displayName}</span>
          </div>
        </header>

        {/* ===================== DASHBOARD ===================== */}
        {activePage === "Dashboard" && (
          <section className="dashboard">
            <div className="hero-card">
              <div className="hero-content">
                <span className="hero-badge">✦ AI-Powered Learning</span>
                <h2>Learn smarter.<br />Remember longer.</h2>
                <p>Upload your notes and let LearnSphere AI help you understand, revise, and retain what you learn.</p>
                <button className="primary-btn" onClick={() => setActivePage("Documents")}>
                  Upload Notes <span>→</span>
                </button>
              </div>
              <div className="hero-decoration">
                <div className="floating-card card-one">✦</div>
                <div className="floating-card card-two">AI</div>
                <div className="hero-orb">L</div>
              </div>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon purple">▣</div>
                <div><span>Documents</span><strong>{documents.length}</strong></div>
              </div>
              <div className="stat-card">
                <div className="stat-icon blue">✦</div>
                <div><span>Questions Asked</span><strong>{chatHistory.length}</strong></div>
              </div>
              <div className="stat-card">
                <div className="stat-icon green">✓</div>
                <div><span>Learning Status</span><strong>Active</strong></div>
              </div>
            </div>

            <div className="section-header">
              <div><h2>Quick Actions</h2><p>Jump back into your learning.</p></div>
            </div>
            <div className="quick-grid">
              {[
                { icon: "+", title: "Upload Document", desc: "Add PDF notes to your knowledge base.", page: "Documents" },
                { icon: "✦", title: "Ask AI", desc: "Ask questions about your notes.", page: "AI Chat" },
                { icon: "◷", title: "Review History", desc: "Continue previous conversations.", page: "History" },
                { icon: "❓", title: "Take a Quiz", desc: "Test your knowledge from your notes.", page: "Quiz" },
                { icon: "🃏", title: "Flashcards", desc: "Review concepts with flashcards.", page: "Flashcards" },
              ].map((item) => (
                <button key={item.page} className="quick-card" onClick={() => setActivePage(item.page)}>
                  <div className="quick-icon">{item.icon}</div>
                  <div><h3>{item.title}</h3><p>{item.desc}</p></div>
                  <span className="arrow">→</span>
                </button>
              ))}
            </div>

            <div className="section-header">
              <div><h2>Recent Documents</h2><p>Your uploaded learning materials.</p></div>
              <button className="text-btn" onClick={() => setActivePage("Documents")}>View all →</button>
            </div>
            <div className="documents-grid">
              {documents.length === 0 ? (
                <div className="empty-card">
                  <div className="empty-icon">▣</div>
                  <h3>No documents yet</h3>
                  <p>Upload your first PDF to start learning.</p>
                  <button className="upload-btn" onClick={() => setActivePage("Documents")}>Upload PDF</button>
                </div>
              ) : (
                documents.slice(0, 3).map((doc, i) => (
                  <div className="document-card" key={i}>
                    <div className="document-icon">PDF</div>
                    <div className="document-info">
                      <h3>{doc.filename}</h3>
                      <p>{doc.chunk_count || 0} chunks indexed</p>
                      {doc.uploaded_at && <small>{formatDate(doc.uploaded_at)}</small>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {/* ===================== DOCUMENTS ===================== */}
        {activePage === "Documents" && (
          <section className="page-section">
            <div
              className={`upload-panel ${dragOver ? "drag-over" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <div className="upload-icon">{uploading ? "⟳" : "↑"}</div>
              <h2>{uploading ? "Uploading..." : dragOver ? "Drop it here!" : "Upload your learning material"}</h2>
              <p>Drag & drop a PDF or click to browse. LearnSphere AI will extract and index its content.</p>
              <label className={`upload-btn ${uploading ? "disabled" : ""}`}>
                {uploading ? "Processing..." : "Choose PDF"}
                <input type="file" accept=".pdf,application/pdf" onChange={handleUpload} disabled={uploading} hidden />
              </label>
              <span className="upload-hint">PDF files only · Max 10 MB</span>
            </div>

            <div className="section-header">
              <div>
                <h2>Your Documents</h2>
                <p>{documents.length} document{documents.length !== 1 ? "s" : ""} uploaded</p>
              </div>
              <div className="search-bar">
                <span>🔍</span>
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && <button className="clear-search" onClick={() => setSearchQuery("")}>✕</button>}
              </div>
            </div>

            {(searchQuery ? documents.filter(d => d.filename.toLowerCase().includes(searchQuery.toLowerCase())) : documents).length === 0 ? (
              <div className="empty-card large">
                <div className="empty-icon">▣</div>
                <h3>No documents uploaded</h3>
                <p>Upload your notes to start using AI-powered learning.</p>
              </div>
            ) : (
              <div className="documents-list-full">
                {(searchQuery ? documents.filter(d => d.filename.toLowerCase().includes(searchQuery.toLowerCase())) : documents).map((doc) => (
                  <div className="document-row" key={doc.file_id || doc.filename}>
                    <div className="document-icon">PDF</div>
                    <div className="document-info">
                      <h3>{doc.filename}</h3>
                      <p>{doc.chunk_count || 0} chunks · {doc.uploaded_at ? formatDate(doc.uploaded_at) : "Recently uploaded"}</p>
                    </div>
                    <button
                      className="summarise-btn"
                      onClick={() => handleGenerateSummary(doc.filename)}
                      title="Summarise this document"
                    >
                      📋
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(doc.file_id)}
                      disabled={deletingId === doc.file_id}
                      title="Delete document"
                    >
                      {deletingId === doc.file_id ? "⟳" : "🗑"}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ===================== AI CHAT ===================== */}
        {activePage === "AI Chat" && (
          <section className="page-section chat-page">
            <div className="chat-intro">
              <div className="ai-avatar">✦</div>
              <div>
                <h2>LearnSphere AI</h2>
                <p>Ask anything about your uploaded documents.</p>
              </div>
            </div>

            {documents.length === 0 && (
              <div className="warning-card">
                <strong>No documents uploaded</strong>
                <p>Upload a PDF first so the AI has learning material to reference.</p>
                <button className="secondary-btn" onClick={() => setActivePage("Documents")}>Upload Document</button>
              </div>
            )}

            <div className="chat-window">
              {messages.length === 0 && (
                <div className="chat-empty">
                  <div className="big-ai-icon">✦</div>
                  <h2>What would you like to learn?</h2>
                  <p>Ask a question based on your uploaded notes.</p>
                  <div className="suggestions">
                    {["What are the main topics?", "Summarise the key points", "What is the most important concept?"].map((s) => (
                      <button key={s} className="suggestion-chip" onClick={() => setQuestion(s)}>{s}</button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <div key={i} className={`chat-bubble-row ${msg.role}`}>
                  {msg.role === "ai" && <div className="bubble-avatar">✦</div>}
                  <div className={`chat-bubble ${msg.role} ${msg.isError ? "error" : ""}`}>
                    {msg.text}
                  </div>
                  {msg.role === "user" && <div className="bubble-avatar user-bubble-avatar">{avatarLetter}</div>}
                </div>
              ))}

              {asking && (
                <div className="chat-bubble-row ai">
                  <div className="bubble-avatar">✦</div>
                  <div className="chat-bubble ai typing">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            <form className="chat-form" onSubmit={handleAsk}>
              <input
                type="text"
                placeholder="Ask a question about your notes..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                disabled={asking}
              />
              <button type="submit" className="send-btn" disabled={asking || !question.trim()}>
                {asking ? "⟳" : "→"}
              </button>
            </form>
          </section>
        )}

        {/* ===================== HISTORY ===================== */}
        {activePage === "History" && (
          <section className="page-section">
            <div className="section-header">
              <div><h2>Previous Conversations</h2><p>Your questions and AI-generated answers.</p></div>
              {chatHistory.length > 0 && (
                <button className="danger-btn" onClick={handleClearHistory} disabled={clearingHistory}>
                  {clearingHistory ? "Clearing..." : "🗑 Clear All"}
                </button>
              )}
            </div>

            {chatHistory.length === 0 ? (
              <div className="empty-card large">
                <div className="empty-icon">◷</div>
                <h3>No chat history</h3>
                <p>Your conversations will appear here.</p>
                <button className="upload-btn" onClick={() => setActivePage("AI Chat")}>Ask AI</button>
              </div>
            ) : (
              <div className="history-list">
                {chatHistory.map((chat, i) => (
                  <div className="history-card" key={i}>
                    <div className="question-row">
                      <div className="history-label">You</div>
                      <p>{chat.question}</p>
                    </div>
                    <div className="answer-row">
                      <div className="history-label ai-label">AI</div>
                      <p>{chat.answer}</p>
                    </div>
                    {chat.created_at && (
                      <small className="history-date">{formatDate(chat.created_at)}</small>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ===================== QUIZ ===================== */}
        {activePage === "Quiz" && (
          <section className="page-section">
            {!quiz && (
              <div className="feature-setup-card">
                <div className="feature-icon quiz-icon">❓</div>
                <h2>Quiz Mode</h2>
                <p>Test your understanding with AI-generated multiple choice questions from your uploaded documents.</p>
                <div className="doc-selector">
                  <label>Choose document (optional)</label>
                  <select value={selectedDoc} onChange={(e) => setSelectedDoc(e.target.value)}>
                    <option value="">All Documents</option>
                    {documents.map((d) => (
                      <option key={d.file_id || d.filename} value={d.filename}>{d.filename}</option>
                    ))}
                  </select>
                </div>
                <button className="feature-btn quiz-btn" onClick={handleGenerateQuiz} disabled={quizLoading || documents.length === 0}>
                  {quizLoading ? "Generating Quiz..." : "🎯 Generate Quiz"}
                </button>
                {documents.length === 0 && <p className="feature-hint">Upload a PDF first to generate a quiz.</p>}
              </div>
            )}

            {quiz && !quiz.finished && (
              <div className="quiz-card">
                <div className="quiz-progress">
                  <span>Question {quiz.current + 1} of {quiz.questions.length}</span>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${(quiz.current / quiz.questions.length) * 100}%` }} />
                  </div>
                  <span>Score: {quiz.score}</span>
                </div>
                <h2 className="quiz-question">{quiz.questions[quiz.current].question}</h2>
                <div className="quiz-options">
                  {quiz.questions[quiz.current].options.map((opt, i) => (
                    <button key={i} className="quiz-option" onClick={() => handleAnswer(opt)}>
                      <span className="option-letter">{String.fromCharCode(65 + i)}</span>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {quiz && quiz.finished && (
              <div className="quiz-results">
                <div className="score-circle">
                  <span className="score-num">{quiz.score}</span>
                  <span className="score-den">/{quiz.questions.length}</span>
                </div>
                <h2>{quiz.score === quiz.questions.length ? "Perfect Score! 🎉" : quiz.score >= quiz.questions.length / 2 ? "Well Done! 👍" : "Keep Studying! 📚"}</h2>
                <p>{Math.round((quiz.score / quiz.questions.length) * 100)}% correct</p>
                <div className="review-list">
                  {quiz.answers.map((a, i) => (
                    <div key={i} className={`review-item ${a.correct ? "correct" : "wrong"}`}>
                      <div className="review-icon">{a.correct ? "✓" : "✕"}</div>
                      <div>
                        <strong>{quiz.questions[i].question}</strong>
                        <p>Your answer: {a.selected}</p>
                        {!a.correct && <p className="correct-ans">Correct: {quiz.questions[i].answer}</p>}
                        <p className="explanation">{a.explanation}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="feature-btn quiz-btn" onClick={restartQuiz}>🔄 New Quiz</button>
                <button className="feature-btn" style={{background:'#1e3a5a',color:'#61a9ed',marginTop:'-8px'}} onClick={exportQuizPDF}>📤 Export as PDF</button>
              </div>
            )}
          </section>
        )}

        {/* ===================== FLASHCARDS ===================== */}
        {activePage === "Flashcards" && (
          <section className="page-section">
            {!flashcards && (
              <div className="feature-setup-card">
                <div className="feature-icon flash-icon">🃏</div>
                <h2>Flashcard Mode</h2>
                <p>Review key concepts with AI-generated flashcards. Click a card to reveal the answer.</p>
                <div className="doc-selector">
                  <label>Choose document (optional)</label>
                  <select value={selectedDoc} onChange={(e) => setSelectedDoc(e.target.value)}>
                    <option value="">All Documents</option>
                    {documents.map((d) => (
                      <option key={d.file_id || d.filename} value={d.filename}>{d.filename}</option>
                    ))}
                  </select>
                </div>
                <button className="feature-btn flash-btn" onClick={handleGenerateFlashcards} disabled={flashLoading || documents.length === 0}>
                  {flashLoading ? "Generating Flashcards..." : "🃏 Generate Flashcards"}
                </button>
                {documents.length === 0 && <p className="feature-hint">Upload a PDF first to generate flashcards.</p>}
              </div>
            )}

            {flashcards && (
              <div className="flashcard-view">
                <div className="flash-progress">
                  <span>Card {flashcards.current + 1} of {flashcards.cards.length}</span>
                  <button className="text-btn" onClick={() => setFlashcards(null)}>✕ Exit</button>
                </div>

                <div
                  className={`flashcard ${flashcards.flipped ? "flipped" : ""}`}
                  onClick={() => setFlashcards({ ...flashcards, flipped: !flashcards.flipped })}
                >
                  <div className="flashcard-inner">
                    <div className="flashcard-front">
                      <div className="card-side-label">Question</div>
                      <p>{flashcards.cards[flashcards.current].front}</p>
                      <span className="tap-hint">Tap to reveal answer</span>
                    </div>
                    <div className="flashcard-back">
                      <div className="card-side-label answer">Answer</div>
                      <p>{flashcards.cards[flashcards.current].back}</p>
                    </div>
                  </div>
                </div>

                <div className="flash-nav">
                  <button
                    className="nav-btn"
                    onClick={() => setFlashcards({ ...flashcards, current: flashcards.current - 1, flipped: false })}
                    disabled={flashcards.current === 0}
                  >← Prev</button>

                  <div className="flash-dots">
                    {flashcards.cards.map((_, i) => (
                      <div key={i} className={`flash-dot ${i === flashcards.current ? "active" : ""}`}
                        onClick={() => setFlashcards({ ...flashcards, current: i, flipped: false })} />
                    ))}
                  </div>

                  <button
                    className="nav-btn"
                    onClick={() => setFlashcards({ ...flashcards, current: flashcards.current + 1, flipped: false })}
                    disabled={flashcards.current === flashcards.cards.length - 1}
                  >Next →</button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ===================== SUMMARY ===================== */}
        {activePage === "Summary" && (
          <section className="page-section">
            {summaryLoading && (
              <div className="loading-card">
                <div className="loading-spinner" />
                <h2>Generating Summary...</h2>
                <p>AI is reading and summarising your document.</p>
              </div>
            )}
            {summary && !summaryLoading && (
              <div className="summary-card">
                <div className="summary-header">
                  <div className="document-icon">PDF</div>
                  <div>
                    <h2>{summary.filename}</h2>
                    <p>AI-generated summary</p>
                  </div>
                  <button className="text-btn" onClick={() => setActivePage("Documents")}>← Back</button>
                </div>
                <div className="summary-body">
                  {summary.text}
                </div>
              </div>
            )}
          </section>
        )}

        {/* ===================== PROGRESS ===================== */}
        {activePage === "Progress" && (
          <section className="page-section">

            {progressLoading && (
              <div className="loading-card">
                <div className="loading-spinner" />
                <h2>Loading your progress...</h2>
              </div>
            )}

            {!progressLoading && (
              <>
                {/* STAT CARDS */}
                <div className="progress-stats">
                  {[
                    { label: "Quizzes Taken",    value: progress?.stats?.total_quizzes   ?? 0, icon: "❓", color: "purple" },
                    { label: "Avg Score",         value: `${progress?.stats?.avg_score    ?? 0}%`, icon: "📊", color: "blue"   },
                    { label: "Best Score",        value: `${progress?.stats?.best_score   ?? 0}%`, icon: "🏆", color: "gold"   },
                    { label: "Questions Answered",value: progress?.stats?.total_questions ?? 0, icon: "✅", color: "green"  },
                  ].map((s) => (
                    <div className="progress-stat-card" key={s.label}>
                      <span className="pstat-icon">{s.icon}</span>
                      <strong className="pstat-value">{s.value}</strong>
                      <span className="pstat-label">{s.label}</span>
                    </div>
                  ))}
                </div>

                {/* SCORE CHART */}
                {progress?.history?.length > 0 && (() => {
                  const pts = [...(progress.history)].reverse().slice(0, 15);
                  const W = 600, H = 160, PAD = 24;
                  const maxY = 100;
                  const xs = pts.map((_, i) => PAD + (i / Math.max(pts.length - 1, 1)) * (W - PAD * 2));
                  const ys = pts.map((p) => H - PAD - ((p.percent / maxY) * (H - PAD * 2)));
                  const polyline = pts.map((_, i) => `${xs[i]},${ys[i]}`).join(" ");
                  const area = `${xs[0]},${H - PAD} ` + pts.map((_, i) => `${xs[i]},${ys[i]}`).join(" ") + ` ${xs[xs.length - 1]},${H - PAD}`;

                  return (
                    <div className="chart-card">
                      <h3>Score History <span>(last {pts.length} quizzes)</span></h3>
                      <svg viewBox={`0 0 ${W} ${H}`} className="score-chart">
                        {/* Grid lines */}
                        {[0, 25, 50, 75, 100].map((v) => {
                          const y = H - PAD - ((v / maxY) * (H - PAD * 2));
                          return (
                            <g key={v}>
                              <line x1={PAD} y1={y} x2={W - PAD} y2={y} stroke="#1e2130" strokeWidth="1" />
                              <text x={PAD - 4} y={y + 4} fontSize="9" fill="#444c5e" textAnchor="end">{v}%</text>
                            </g>
                          );
                        })}
                        {/* Filled area */}
                        <polygon points={area} fill="url(#chartGrad)" opacity="0.25" />
                        {/* Line */}
                        <polyline points={polyline} fill="none" stroke="#6256e9" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                        {/* Dots */}
                        {pts.map((p, i) => (
                          <circle key={i} cx={xs[i]} cy={ys[i]} r="4" fill="#6256e9" stroke="#0d0f17" strokeWidth="2" />
                        ))}
                        <defs>
                          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#6256e9" />
                            <stop offset="100%" stopColor="#6256e9" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                      </svg>
                    </div>
                  );
                })()}

                {/* RECENT QUIZZES */}
                <div className="section-header" style={{ marginTop: "24px" }}>
                  <div><h2>Recent Quizzes</h2><p>Your last {progress?.history?.length ?? 0} attempts</p></div>
                  <button className="text-btn" onClick={() => setActivePage("Quiz")}>Take a Quiz →</button>
                </div>

                {(!progress?.history || progress.history.length === 0) ? (
                  <div className="empty-card large">
                    <div className="empty-icon">📈</div>
                    <h3>No quizzes taken yet</h3>
                    <p>Complete a quiz to see your progress here.</p>
                    <button className="upload-btn" onClick={() => setActivePage("Quiz")}>Take a Quiz</button>
                  </div>
                ) : (
                  <div className="recent-quizzes">
                    {progress.history.map((r, i) => (
                      <div className="recent-quiz-row" key={i}>
                        <div className={`quiz-score-badge ${r.percent >= 80 ? "great" : r.percent >= 50 ? "ok" : "low"}`}>
                          {r.percent}%
                        </div>
                        <div className="rq-info">
                          <strong>{r.filename}</strong>
                          <span>{r.score}/{r.total} correct · {r.completed_at ? new Date(r.completed_at).toLocaleDateString() : ""}</span>
                        </div>
                        <div className="rq-bar">
                          <div className="rq-fill" style={{ width: `${r.percent}%`, background: r.percent >= 80 ? "#6ee7a8" : r.percent >= 50 ? "#6256e9" : "#f07474" }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

          </section>
        )}

        {/* ===================== STUDY PLAN ===================== */}
        {activePage === "Study Plan" && (
          <section className="page-section">
            {!studyPlan && !studyPlanLoading && (
              <div className="feature-setup-card">
                <div className="feature-icon">📅</div>
                <h2>Study Plan Generator</h2>
                <p>Get a personalised 7-day revision schedule based on your uploaded notes.</p>
                <div className="doc-selector">
                  <label>Choose document (optional)</label>
                  <select value={selectedDoc} onChange={(e) => setSelectedDoc(e.target.value)}>
                    <option value="">All Documents</option>
                    {documents.map((d) => (
                      <option key={d.file_id || d.filename} value={d.filename}>{d.filename}</option>
                    ))}
                  </select>
                </div>
                <button className="feature-btn quiz-btn" onClick={handleGenerateStudyPlan} disabled={studyPlanLoading || documents.length === 0}>
                  📅 Generate Study Plan
                </button>
                {documents.length === 0 && <p className="feature-hint">Upload a PDF first.</p>}
              </div>
            )}

            {studyPlanLoading && (
              <div className="loading-card">
                <div className="loading-spinner" />
                <h2>Building your study plan...</h2>
                <p>AI is analysing your notes and creating a schedule.</p>
              </div>
            )}

            {studyPlan && !studyPlanLoading && (
              <div className="study-plan">
                <div className="section-header">
                  <div>
                    <h2>Your 7-Day Study Plan</h2>
                    <p>Based on: {studyPlan.filename}</p>
                  </div>
                  <button className="danger-btn" onClick={() => setStudyPlan(null)}>🔄 Regenerate</button>
                </div>
                <div className="plan-grid">
                  {studyPlan.plan.map((day) => (
                    <div className="plan-day" key={day.day}>
                      <div className="plan-day-header">
                        <div className="day-badge">Day {day.day}</div>
                        <div className="plan-meta">
                          <span className="plan-focus">{day.focus}</span>
                          <span className="plan-duration">⏱ {day.duration}</span>
                        </div>
                      </div>
                      <h3>{day.title}</h3>
                      <ul className="plan-tasks">
                        {day.tasks.map((task, ti) => (
                          <li key={ti}>
                            <span className="task-dot" />
                            {task}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* ===================== PROFILE ===================== */}
        {activePage === "Profile" && (
          <section className="page-section">
            <div className="profile-card">
              <div className="profile-avatar">{avatarLetter}</div>
              <div className="profile-details">
                <h2>{displayName}</h2>
                <p>{email}</p>
                <span className="status-active">● Active</span>
              </div>
            </div>

            <div className="settings-card">
              <h2>Account Overview</h2>
              {[
                { label: "Email", desc: "Your registered email", value: email },
                { label: "Documents", desc: "Number of uploaded PDFs", value: documents.length },
                { label: "AI Conversations", desc: "Total questions asked", value: chatHistory.length },
                { label: "Account Status", desc: "Current status", value: <span className="status-active">Active</span> },
              ].map((row) => (
                <div className="setting-row" key={row.label}>
                  <div>
                    <strong>{row.label}</strong>
                    <p>{row.desc}</p>
                  </div>
                  <span>{row.value}</span>
                </div>
              ))}

              {/* Name edit row */}
              <div className="setting-row">
                <div>
                  <strong>Display Name</strong>
                  <p>Your name shown in the app</p>
                </div>
                {editingName ? (
                  <div className="name-edit-row">
                    <input
                      className="name-input"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleUpdateName()}
                      placeholder="Enter your name"
                      autoFocus
                    />
                    <button className="save-name-btn" onClick={handleUpdateName} disabled={savingName}>
                      {savingName ? "Saving..." : "Save"}
                    </button>
                    <button className="cancel-name-btn" onClick={() => setEditingName(false)}>✕</button>
                  </div>
                ) : (
                  <div className="name-display-row">
                    <span>{displayName}</span>
                    <button className="edit-name-btn" onClick={() => { setNameInput(displayName); setEditingName(true); }}>✎ Edit</button>
                  </div>
                )}
            </div>

            <button className="logout-large-btn" onClick={handleLogout}>
              ⇥ Logout from LearnSphere
            </button>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;