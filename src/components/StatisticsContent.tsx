import React, {useEffect, useState} from 'react';
import {getLists, getSavedWordsFromList, getWordStatistics} from "../modules/wordLists";
import {
  Select,
  MenuItem,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  FormControl,
  InputLabel, SelectChangeEvent,
} from '@mui/material';
import ArrowUpward from '@mui/icons-material/ArrowUpward';
import ArrowDownward from '@mui/icons-material/ArrowDownward';



const ALL_LISTS = 'All_LISTS_3213546516541';

const StatisticsContent = () => {
  const [lists, setLists] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<{ key: null | number, direction: string }>({ key: null, direction: 'asc' });
  const [selectedList, setSelectedList] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<{ [word: string]: number }>({});
  const columnNames = ["Word", "Times Seen"];

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
    if (key !== null) {
      sortableItems.sort((a, b) => {
        // Convert to lowercase if sorting by word (index 0)
        const aValue = key === 0 ? a[key].toLowerCase() : a[key];
        const bValue = key === 0 ? b[key].toLowerCase() : b[key];

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
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

  const handleListChange = (e: SelectChangeEvent<unknown>) => {
    const newList = e.target.value as string; // Type cast value to string
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
      return sortConfig.direction === 'asc' ?
        <ArrowUpward fontSize="small" style={{ verticalAlign: '2px' }} /> :
        <ArrowDownward fontSize="small" style={{ verticalAlign: '2px' }} />;
    }
    return <span style={{ width: '24px', display: 'inline-block' }}></span>;
  };


  return (
    <div>
      <FormControl variant="outlined" fullWidth>
        <InputLabel
          id="ListSelectionSelectLabel"
        >
          Select List</InputLabel>
        <Select
          labelId="ListSelectionSelectLabel"
          id="ListSelectionSelect"
          onChange={handleListChange}
          value={selectedList || ""}
        >
          <MenuItem key={ALL_LISTS} value={ALL_LISTS}>
            All Lists
          </MenuItem>
          {lists.map((listName) => (
            <MenuItem key={listName} value={listName}>
              {listName}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <div id="ListStatistics">
        <Table>
          <TableHead>
            <TableRow>
              {columnNames.map((name, index) => (
                <TableCell key={index} onClick={() => handleSort(index)}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
                    <span>{name}</span>
                    <span style={{ marginLeft: '8px', width: '24px', display: 'inline-block' }}>{getSortIndicator(index)}</span>
                  </div>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedStatistics.map(([word, stat]) => (
              <TableRow key={word}>
                <TableCell>{word}</TableCell>
                <TableCell>{stat}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};


export default StatisticsContent;
