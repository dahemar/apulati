import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Music from './pages/Music';
import TheatreWorks from './pages/TheatreWorks';
import Contact from './pages/Contact';
import SimpleVideoTest from './components/SimpleVideoTest';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<TheatreWorks />} />
          <Route path="/music" element={<Music />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/debug" element={<SimpleVideoTest />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
