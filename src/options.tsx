import React from "react";
import { createRoot } from 'react-dom/client';


const App: React.FC = () => {
  return (
    <div>
      Hello, this is options!
    </div>
  );
};

// Using createRoot API
const root = document.getElementById('root');
if (root) {
  const rootContainer = createRoot(root);
  rootContainer.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}



