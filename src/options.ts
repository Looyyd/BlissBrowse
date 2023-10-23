// Define an array of objects mapping tabs to content
const tabContentMapping = [
  {
    tab: 'StatisticsTab',
    content: 'Statistics'
  },
  {
    tab: 'WordlistsTab',
    content: 'WordLists'
  },
  {
    tab: 'BlacklistedSitesTab',
    content: 'BlacklistedSites'
  }
];

document.addEventListener('DOMContentLoaded', function() {
  // Loop over the array and add event listeners
  tabContentMapping.forEach((item) => {
    const tabElement = document.getElementById(item.tab);
    const contentElement = document.getElementById(item.content);

    // If the elements exist, add click event listeners
    if (tabElement && contentElement) {
      tabElement.addEventListener('click', function() {
        // Loop over to hide all content sections
        tabContentMapping.forEach((innerItem) => {
          const innerContentElement = document.getElementById(innerItem.content);
          if (innerContentElement) {
            innerContentElement.style.display = 'none';
          }
        });

        // Show the content associated with the clicked tab
        contentElement.style.display = 'block';
      });
    }
  });
});
