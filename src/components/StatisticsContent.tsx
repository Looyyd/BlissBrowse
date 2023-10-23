import React, {useEffect, useState} from 'react';
import {getLists, getSavedWordsFromList, getWordStatistics} from "../modules/wordLists";

const StatisticsContent = () => {
  const [lists, setLists] = useState<string[]>([]);
  const [selectedList, setSelectedList] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<{ [word: string]: number }>({});

  useEffect(() => {
    // Assume getLists() returns a Promise<string[]>
    getLists().then(setLists);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedList) return;

    const statisticsDiv: { [word: string]: number } = {};
    const words = await getSavedWordsFromList(selectedList);

    for (const word of words) {
      statisticsDiv[word] = await getWordStatistics(word);
    }

    setStatistics(statisticsDiv);
  };

  return (
    <div>
      <form id="ListSelectionForm" onSubmit={handleSubmit}>
        <select
          id="ListSelectionSelect"
          onChange={(e) => setSelectedList(e.target.value)}
        >
          {lists.map((listName) => (
            <option key={listName} value={listName}>
              {listName}
            </option>
          ))}
        </select>
        <button type="submit">Show Statistics</button>
      </form>
      <div id="ListStatistics">
        <table>
          {Object.entries(statistics).map(([word, stat]) => (
            <tr key={word}>
              <td>{word}</td>
              <td>{stat}</td>
            </tr>
          ))}
        </table>
      </div>
    </div>
  );
};

export default StatisticsContent;
