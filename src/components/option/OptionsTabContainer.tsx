import React, {useEffect, useState} from 'react';
import BlacklistedSitesEditor from "./BlacklistedSitesEditor";
import FilterWordlistsEditor from "./FilterWordlistsEditor";
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import GlobalSettings from "./GlobalSettings";
import WordStatistics from "./WordStatistics";
import {ML_FEATURES} from "../../constants";
import MLSettings from "./ML/MLSettings";

const TabContainer = () => {
  const [activeTab, setActiveTab] = useState(() => {
    // Try to read from localStorage, to keep same tab active on refresh
    const storedValue = localStorage.getItem('activeTab');
    return storedValue === null ? 0 : Number(storedValue);
  });

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  useEffect(() => {
    // Get query parameters from the URL, if we edit button was clicked
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    if (tab && Number(tab) < tabContentMapping.length) {
      setActiveTab(Number(tab));
    }
  }, []);

  useEffect(() => {
    // Store the active tab index whenever it changes
    localStorage.setItem('activeTab', activeTab.toString());
  }, [activeTab]);


  const tabContentMapping = [
    {
      tab: 'Statistics',
      content: <WordStatistics />,
    },
    {
      tab: 'Filter Lists',
      content: <FilterWordlistsEditor />,
    },
    {
      tab: 'Blacklisted Websites',
      content: <BlacklistedSitesEditor />,
    },
    /*
    {
      tab: 'Settings',
      content: <GlobalSettings />,
    }
     */
  ];
  if (ML_FEATURES) {
    tabContentMapping.push({
      tab: 'Machine Learning',
      content: <MLSettings />,
    });
  }

  return (
    <div>
      <Tabs value={activeTab} onChange={handleChange}>
        {tabContentMapping.map(({ tab }) => (
          <Tab key={tab} id={`${tab.replace(" ", "_")}Tab`} label={tab} />
        ))}
      </Tabs>
      <Box sx={{ marginTop: 2 }} >
        {tabContentMapping.map(({ tab, content }, index) => (
          <Box
            key={tab}
            id={tab}
            sx={{ display: activeTab === index ? 'block' : 'none' }}
          >
            {content}
        </Box>
        ))}
      </Box>
    </div>
  );

};

export default TabContainer;
