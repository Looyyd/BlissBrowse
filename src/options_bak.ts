import {getLists, getSavedWordsFromList, getWordStatistics} from "./modules/wordLists";

//TODO: don't hardcode all those strings
//TODO: use typescript or React?
async function displayStatisticsContent(){
  //select a list
  const lists = await getLists();

  const selectList = document.getElementById('ListSelectionSelect');

  if(selectList){
    lists.forEach((listName) =>{
      const option = document.createElement("option");
      option.value = listName;
      option.text = listName;
      selectList.appendChild(option);
    })
  }

  document.getElementById("ListSelectionForm")?.addEventListener('submit', async function() {
    const listName = (document.getElementById('listName') as HTMLInputElement)?.value;
    if(listName){
      const statisticsDiv = document.getElementById('ListStatistics');
      if (statisticsDiv === null){
        return;
      }
      const statistics_table = document.createElement('table');

      const words = await getSavedWordsFromList(listName);
      for (const word of words) {
        const statistics = await getWordStatistics(word);
        const table_line = document.createElement("tr");
        const word_cell = document.createElement("td");
        const stat_cell = document.createElement("td");
        stat_cell.textContent = statistics.toString();
        word_cell.textContent = word;
        table_line.appendChild(word_cell);
        table_line.appendChild(stat_cell)

        statisticsDiv.appendChild(table_line)
        statistics_table.appendChild(table_line)
      }
      statisticsDiv.appendChild(statisticsDiv);
    }
  });

}


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
      tabElement.addEventListener('click', async function () {
        // Loop over to hide all content sections
        tabContentMapping.forEach((innerItem) => {
          const innerContentElement = document.getElementById(innerItem.content);
          if (innerContentElement) {
            innerContentElement.style.display = 'none';
          }
        });

        // Show the content associated with the clicked tab
        contentElement.style.display = 'block';
        if (item.content == "Statistics") {
          await displayStatisticsContent();
        }
      });
    }
  });
});
