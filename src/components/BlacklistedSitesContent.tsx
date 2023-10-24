import React, {useEffect, useState} from 'react';
import {getHostnameBlacklist} from "../modules/hostname";


const BlacklistedSitesContent = () => {
  const [blacklist, setBlacklist] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const blacklist = await getHostnameBlacklist();
      setBlacklist(blacklist);
    };
    fetchData();
  });


  return (
    <div>
      {blacklist.length === 0 ? (
        <div>No blacklisted sites</div>
      ) : (
        blacklist.map((hostname) => (
          <div key={hostname}>{hostname}</div>
        ))
      )}
    </div>
  )
};


export default BlacklistedSitesContent;
