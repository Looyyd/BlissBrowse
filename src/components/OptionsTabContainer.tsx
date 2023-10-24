import React, { useState } from 'react';
import StatisticsContent from "./StatisticsContent";
import BlacklistedSitesContent from "./BlacklistedSitesContent";

const TabContainer = () => {
  const [activeTab, setActiveTab] = useState<string>('Statistics');

  const tabContentMapping = [
    {
      tab: 'Statistics',
      content: <StatisticsContent />,
    },
    {
      tab: 'WordLists',
      content: 'Word Lists Content Here',
    },
    {
      tab: 'BlacklistedSites',
      content: <BlacklistedSitesContent />,
    },
  ];

  return (
    <div>
      <div>
        {tabContentMapping.map(({ tab }) => (
          <button
            key={tab}
            id={`${tab}Tab`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>
      <div>
        {tabContentMapping.map(({ tab, content }) => (
          <div
            key={tab}
            id={tab}
            style={{ display: activeTab === tab ? 'block' : 'none' }}
          >
            {content}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TabContainer;
