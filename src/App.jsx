import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Music from './pages/Music';
import TheatreWorks from './pages/TheatreWorks';
import Contact from './pages/Contact';
import SimpleVideoTest from './components/SimpleVideoTest';
import { MEDIA_PATHS_RAW } from './config/constants';
import './App.css';

// Transform raw media paths into works data
const theatreWorks = [
  {
    id: 1,
    title: 'Concours de Larmes',
    ...MEDIA_PATHS_RAW.CONCOURS_DE_LARMES
  },
  {
    id: 2,
    title: 'Qui à Peur',
    ...MEDIA_PATHS_RAW.QUI_A_PEUR
  }
];

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<TheatreWorks works={theatreWorks} />} />
        <Route path="/music" element={<Music />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/debug" element={<SimpleVideoTest />} />
      </Routes>
    </div>
  );
}

export default App;
