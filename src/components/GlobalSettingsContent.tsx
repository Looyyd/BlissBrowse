import {Action, ColorTheme} from "../modules/types"
import {MenuItem, Select} from "@mui/material";
import {DEFAULT_FILTER_ACTION} from "../constants";
import React from "react";
import {
  ColorThemeStore,
  FilterActionStore,
} from "../modules/settings";
import {SelectChangeEvent} from "@mui/material/Select/SelectInput";
import { useEffect, useState } from 'react';

const GlobalSettingsContent = () => {
  const colorThemeStore = new ColorThemeStore();
  const filterActionstore = new FilterActionStore();
  const [selectedAction, setSelectedAction] = useState<Action>(DEFAULT_FILTER_ACTION);
  const [selectedColorTheme, setSelectedColorTheme] = useState<ColorTheme>(colorThemeStore.get());
  const actions = Object.values(Action);
  const colorThemes = Object.values(ColorTheme);


  useEffect(() => {
    const fetchData = async () => {
      const previous_action = await filterActionstore.get();
      setSelectedAction(previous_action);
    };
    fetchData();
  }, []);

  async function onActionChange(event: SelectChangeEvent<Action>) {
    const action = event.target.value as Action;
    setSelectedAction(action);
    await filterActionstore.set(action);
  }

  async function onColorThemeChange(event: SelectChangeEvent<ColorTheme>) {
    const colorTheme = event.target.value as ColorTheme;
    setSelectedColorTheme(colorTheme);
    colorThemeStore.set(colorTheme);
  }

  return (
    <>
      <Select
        labelId="filterActionSelect-label"
        id="filterActionSelect"
        value={selectedAction}
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
        value={selectedColorTheme}
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

export default GlobalSettingsContent;
