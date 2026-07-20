import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { initLiff } from './lib/liff';
import { useConfiguratorStore } from './store/useConfiguratorStore';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Fire-and-forget: resolves to null outside LINE's in-app browser, so this
// never blocks or affects the app for customers using a regular browser.
initLiff().then((idToken) => useConfiguratorStore.getState().setLiffIdToken(idToken));
