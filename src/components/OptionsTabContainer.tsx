import React, { useState } from 'react';
import StatisticsContent from "./StatisticsContent";
import BlacklistedSitesContent from "./BlacklistedSitesContent";
import WordlistsContent from "./WordlistsContent";
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';

const TabContainer = () => {
  const [activeTab, setActiveTab] = useState(0); // Initialize to the first tab

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };



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
