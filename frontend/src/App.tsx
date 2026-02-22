import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Roletrando from './games/Roletrando';
import Millionaire from './games/Millionaire';
import Quiz from './games/Quiz';
import Statistics from './pages/Statistics';
import Ranking from './pages/Ranking';
import { UserProvider } from './context/UserContext';
import { ThemeProvider } from './context/ThemeContext';
import './App.css';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <UserProvider>
        <Router>
          <div className="app-container">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/roletrando" element={<Roletrando />} />
              <Route path="/millionaire" element={<Millionaire />} />
              <Route path="/quiz" element={<Quiz />} />
              <Route path="/stats" element={<Statistics />} />
              <Route path="/ranking" element={<Ranking />} />
            </Routes>
          </div>
        </Router>
      </UserProvider>
    </ThemeProvider>
  );
};

export default App;
