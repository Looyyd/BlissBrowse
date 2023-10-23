import React from "react";
import { createRoot } from 'react-dom/client';
import TabContainer from "./components/OptionsTabContainer";


const App: React.FC = () => {
  return (
    <TabContainer />
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



