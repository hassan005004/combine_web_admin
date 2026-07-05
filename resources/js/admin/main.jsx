import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';

const root = document.getElementById('react-admin-root');

if (root) {
  createRoot(root).render(<App />);
}
