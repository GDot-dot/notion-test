import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter as Router } from 'react-router-dom';
import App from './App.tsx';
import { ProjectProvider } from './context/ProjectContext.tsx';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <Router>
      <ProjectProvider>
        <App />
      </ProjectProvider>
    </Router>
  </React.StrictMode>
);