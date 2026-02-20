import React from 'react';
import GloomdepthGame from './components/GloomdepthGame';

const App: React.FC = () => {
  return (
    <div className="w-full h-screen flex items-center justify-center bg-black text-white overflow-hidden">
      <GloomdepthGame />
    </div>
  );
};

export default App;