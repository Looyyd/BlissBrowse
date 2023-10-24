import React, {useEffect, useState} from 'react';
import {getLists, getSavedWordsFromList, getWordStatistics} from "../modules/wordLists";

const StatisticsContent = () => {
  const [lists, setLists] = useState<string[]>([]);
  const [selectedList, setSelectedList] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<{ [word: string]: number }>({});

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



  const fetchStatistics = async (list: string | null) => {
    if (!list) return;

    const statisticsDiv: { [word: string]: number } = {};
    const words = await getSavedWordsFromList(list);

    for (const word of words) {
      statisticsDiv[word] = await getWordStatistics(word);
    }

    setStatistics(statisticsDiv);
  };

  const handleListChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newList = e.target.value;
    setSelectedList(newList);
    fetchStatistics(newList);
  };

  return (
    <div>
      <select
        id="ListSelectionSelect"
        onChange={handleListChange}
      >
        {lists.map((listName) => (
          <option key={listName} value={listName}>
            {listName}
          </option>
        ))}
      </select>
      <div id="ListStatistics">
        <table>
          <tbody>
            {Object.entries(statistics).map(([word, stat]) => (
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
