import {FilterAction, ColorTheme} from "../../modules/types"
import {MenuItem, Select} from "@mui/material";
import React from "react";
import {
  ColorThemeStore,
  FilterActionStore,
} from "../../modules/settings";
import {SelectChangeEvent} from "@mui/material/Select/SelectInput";
import { useEffect} from 'react';

const GlobalSettings = () => {
  const colorThemeStore = new ColorThemeStore();
  const filterActionStore = new FilterActionStore();
  const [selectedAction, setSelectedAction] = filterActionStore.useData();
  const [selectedColorTheme, setSelectedColorTheme] = colorThemeStore.useData();
  const filterActions = Object.values(FilterAction);
  const colorThemes = Object.values(ColorTheme);


  useEffect(() => {
    const fetchData = async () => {
      const previous_action = await filterActionStore.get();
      await setSelectedAction(previous_action);
    };
    fetchData();
  }, []);

  async function onActionChange(event: SelectChangeEvent<FilterAction>) {
    const action = event.target.value as FilterAction;
    await setSelectedAction(action);
  }

  async function onColorThemeChange(event: SelectChangeEvent<ColorTheme>) {
    const colorTheme = event.target.value as ColorTheme;
    await setSelectedColorTheme(colorTheme);
  }

  return (
    <>
      <Select
        labelId="filterActionSelect-label"
        id="filterActionSelect"
        value={selectedAction !== null ? selectedAction : ""}
        onChange={onActionChange}
        disabled={filterActions.length === 0}
      >
        {filterActions.map((actionName) => (
          <MenuItem key={actionName} value={actionName}>
            {actionName}
          </MenuItem>
        ))}
      </Select>
      <Select
        labelId="colorThemeSelect-label"
        id="colorThemeSelect"
        value={selectedColorTheme !== null ? selectedColorTheme : ""}
        onChange={onColorThemeChange}
        disabled={colorThemes.length === 0}
      >
        {colorThemes.map((colorThemeName) => (
          <MenuItem key={colorThemeName} value={colorThemeName}>
            {colorThemeName}
          </MenuItem>
        ))}
      </Select>
    </>
  )
}

export default GlobalSettings;
