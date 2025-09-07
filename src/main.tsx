import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import AppMine from './AppMine.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppMine />
  </StrictMode>
);
