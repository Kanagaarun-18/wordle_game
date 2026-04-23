import { useState } from "react";
import axios from "axios";

function Login({ setUser }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const validate = () => {
    if (!email || !password) {
      alert("All fields are required");
      return false;
    }
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;

    if (!gmailRegex.test(email)) {
      alert("Enter a valid Gmail address");
      return false;
    }
    
    return true;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    try {
      const res = await axios.post("http://localhost:5000/auth/login", {
        email,
        password
      });

      localStorage.setItem("userId", res.data.userId);
      setUser(res.data.userId);
    } catch (err) {
      alert("Invalid credentials");
    }
  };

  const handleSignup = async () => {
    if (!validate()) return;

    try {
      await axios.post("http://localhost:5000/auth/signup", {
        email,
        password
      });
      alert("Signup successful! Now login.");
    } catch {
      alert("Signup failed");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Welcome Back</h2>
        <p className="subtitle">Login to continue</p>

        <input
          className="auth-input"
          type="email"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="auth-input"
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button className="auth-btn primary" onClick={handleLogin}>
          Login
        </button>

        <div className="divider">or</div>

        <button className="auth-btn secondary" onClick={handleSignup}>
          Create Account
        </button>
      </div>
    </div>
  );
}

export default Login;