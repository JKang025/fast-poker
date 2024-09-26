import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import LobbyPage from './components/LobbyPage';
import GamePage from './components/GamePage';

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/lobby" element={<LobbyPage />} />
        <Route path="/game/:gameId" element={<GamePage />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
};

export default App;
