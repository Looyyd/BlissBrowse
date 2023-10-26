import React, {useEffect, useState} from 'react';
import StatisticsContent from "./StatisticsContent";
import BlacklistedSitesContent from "./BlacklistedSitesContent";
import WordlistsContent from "./WordlistsContent";
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import GlobalSettingsContent from "./GlobalSettingsContent";

const TabContainer = () => {
  const [activeTab, setActiveTab] = useState(() => {
    // Try to read from localStorage, to keep same tab active on refresh
    const storedValue = localStorage.getItem('activeTab');
    return storedValue !== null ? Number(storedValue) : 0;
  });

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  useEffect(() => {
    // Store the active tab index whenever it changes
    localStorage.setItem('activeTab', activeTab.toString());
  }, [activeTab]);


  const tabContentMapping = [
    {
      tab: 'Statistics',
      content: <StatisticsContent />,
    },
    {
      tab: 'Filter Lists',
      content: <WordlistsContent />,
    },
    {
      tab: 'Blacklisted Websites',
      content: <BlacklistedSitesContent />,
    },
    {
      tab: 'Settings',
      content: <GlobalSettingsContent />,
    }
  ];

  return (
    <div>
      <Tabs value={activeTab} onChange={handleChange}>
        {tabContentMapping.map(({ tab }) => (
          <Tab key={tab} id={`${tab}Tab`} label={tab} />
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
