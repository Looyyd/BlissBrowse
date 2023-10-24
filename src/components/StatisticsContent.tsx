import React, {useEffect, useState} from 'react';
import {getLists, getSavedWordsFromList, getWordStatistics} from "../modules/wordLists";


const ALL_LISTS = 'All_LISTS_3213546516541';

const StatisticsContent = () => {
  const [lists, setLists] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: null | number, direction: string }>({ key: null, direction: 'asc' });
  const [selectedList, setSelectedList] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<{ [word: string]: number }>({});
  const columnNames = ["Word", "Stat"];

  useEffect(() => {
    // Define an async function
    const fetchData = async () => {
      const lists = await getLists();

      setLists(lists);
      if (lists.length > 0) {
        setSelectedList(lists[0]);
        fetchStatistics(lists[0]);
      }
    };
    fetchData();
  }, []);

  const sortedStatistics = React.useMemo(() => {
    const sortableItems = Object.entries(statistics);
    const key = sortConfig.key;
    if ( key !== null) {
      sortableItems.sort((a, b) => {
        if (a[key] < b[key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[key] > b[key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [statistics, sortConfig]);



  const fetchStatistics = async (list: string | null) => {
    if (!list) return;
    let lists_to_show: string[];
    if (list === ALL_LISTS) {
      lists_to_show = lists;
    }
    else {
      lists_to_show = [list];
    }

    let words_to_show: string[] = [];
    for (const list of lists_to_show) {
      const words = await getSavedWordsFromList(list);
      words_to_show = words_to_show.concat(words);
    }

    words_to_show = [...new Set(words_to_show)];



    const statisticsDiv: { [word: string]: number } = {};
    for (const word of words_to_show) {
      statisticsDiv[word] = await getWordStatistics(word);
    }

    setStatistics(statisticsDiv);
  };

  const handleListChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newList = e.target.value;
    setSelectedList(newList);
    fetchStatistics(newList);
  };

  const handleSort = (key: number) => {
    if (sortConfig.key === key) {
      setSortConfig({ key, direction: sortConfig.direction === 'asc' ? 'desc' : 'asc' });
    } else {
      setSortConfig({ key, direction: 'asc' });
    }
  };
  // Function to return sort indicator
  const getSortIndicator = (key: number) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === 'asc' ? ' ↑' : ' ↓';
    }
    return '';
  };

  return (
    <div>
      <select
        id="ListSelectionSelect"
        onChange={handleListChange}
      >
        <option key={ALL_LISTS} value={ALL_LISTS}>
          All Lists
        </option>
        {lists.map((listName) => (
          <option key={listName} value={listName}>
            {listName}
          </option>
        ))}
      </select>
      <div id="ListStatistics">
        <table>
          <thead>
          <tr>
             {columnNames.map((name, index) => (
            <th key={index} onClick={() => handleSort(index)}>
              {name} {getSortIndicator(index)}
            </th>
          ))}
          </tr>
          </thead>
          <tbody>
          {sortedStatistics.map(([word, stat]) => (
            <tr key={word}>
              <td>{word}</td>
              <td>{stat}</td>
            </tr>
          ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};


export default StatisticsContent;
