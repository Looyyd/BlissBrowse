import ListsDisplay from "./components/ListsDisplay";
import React from 'react';
import { createRoot } from 'react-dom/client';
import DisableWebsiteButton from "./components/DisableWebsiteButton";
import CustomWordForm from "./components/CustomWordForm";
import NewListForm from "./components/NewListForm";
import OpenOptionsButton from "./components/OpenOptionsButton";


const Popup: React.FC = () => {
  return (
    <>
      <OpenOptionsButton/>
      <DisableWebsiteButton />
      <CustomWordForm />
      <NewListForm />
      <ListsDisplay />
    </>
  );
};

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(
    <>
      <React.StrictMode>
        <Popup/>
      </React.StrictMode>
    </>
  );
}
