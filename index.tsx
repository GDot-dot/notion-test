
import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom'; // 修改這裡
import App from './App.tsx';
import { ProjectProvider } from './context/ProjectContext.tsx';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <HashRouter> {/* 修改這裡 */}
      <ProjectProvider>
        <App />
      </ProjectProvider>
    </HashRouter>
  </React.StrictMode>
);
