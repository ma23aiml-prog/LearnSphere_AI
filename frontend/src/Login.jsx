
import { useState } from "react";
import "./App.css";

function Login({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    const endpoint = isRegister ? "register" : "login";

    try {
      const response = await fetch(
        `http://127.0.0.1:5000/api/auth/${endpoint}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            isRegister
              ? { name, email, password }
              : { email, password }
          ),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `${isRegister ? "Registration" : "Login"} failed`);
      }

      if (isRegister) {
        setMessage("Account created successfully! You can now log in.");
        setIsRegister(false);
        setPassword("");
      } else {
        localStorage.setItem("token", data.token);
        localStorage.setItem("userEmail", email);
        onLogin(email, "");
      }
    } catch (error) {
      setMessage(error.message || "Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsRegister(!isRegister);
    setMessage("");
    setPassword("");
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="brand-icon">L</div>

        <h1>{isRegister ? "Create your account" : "Welcome to LearnSphere"}</h1>

        <p>
          {isRegister
            ? "Sign up to begin your learning journey."
            : "Login to continue your learning journey."}
        </p>

        <form onSubmit={handleSubmit}>
          {isRegister && (
            <input
              type="text"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          )}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password (minimum 8 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={isRegister ? 8 : undefined}
            required
          />

          <button type="submit" disabled={loading}>
            {loading
              ? isRegister ? "Creating account..." : "Logging in..."
              : isRegister ? "Create Account" : "Login"}
          </button>
        </form>

        {message && <div className="login-message">{message}</div>}

        <p>
          {isRegister ? "Already have an account? " : "Don't have an account? "}
          <button
            type="button"
            onClick={switchMode}
            disabled={loading}
          >
            {isRegister ? "Login" : "Register"}
          </button>
        </p>
      </div>
    </div>
  );
}

export default Login;
