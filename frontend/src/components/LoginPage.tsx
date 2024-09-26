import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';  // Updated import
import { login } from '../utils/api';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();  // useNavigate replaces useHistory

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      console.log('hi')
      const token = await login(username, password);
      localStorage.setItem('token', token);
      navigate('/lobby');  // navigate instead of history.push
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <div>
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Username:
          <input value={username} onChange={(e) => setUsername(e.target.value)} required />
        </label>
        <br />
        <label>
          Password:
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        <br />
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default LoginPage;
