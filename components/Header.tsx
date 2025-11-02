import React from 'react';
import { AppContext } from '../App';

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  return (
    <header className="lg:hidden bg-gray-800/50 backdrop-blur-sm sticky top-0 z-20 p-4 border-b border-gray-700 flex items-center justify-between">
      <button onClick={toggleSidebar} className="text-white p-2 rounded-md hover:bg-gray-700">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
      </button>
      <h1 className="text-lg font-bold text-white">AI Social Studio</h1>
    </header>
  );
};

export default Header;