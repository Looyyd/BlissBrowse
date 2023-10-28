import {Action, ColorTheme} from "../../modules/types"
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
  const filterActionstore = new FilterActionStore();
  const [selectedAction, setSelectedAction] = filterActionstore.useData();
  const [selectedColorTheme, setSelectedColorTheme] = colorThemeStore.useData();
  const actions = Object.values(Action);
  const colorThemes = Object.values(ColorTheme);


  useEffect(() => {
    const fetchData = async () => {
      const previous_action = await filterActionstore.get();
      await setSelectedAction(previous_action);
    };
    fetchData();
  }, []);

  async function onActionChange(event: SelectChangeEvent<Action>) {
    const action = event.target.value as Action;
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
        disabled={actions.length === 0}
      >
        {actions.map((actionName) => (
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
