import {Action, ColorTheme} from "../modules/types"
import {MenuItem, Select} from "@mui/material";
import {DEFAULT_COLOR_THEME, DEFAULT_FILTER_ACTION} from "../constants";
import React from "react";
import {getColorTheme, getFilterAction, setColorTheme, setFilterAction} from "../modules/settings";
import {SelectChangeEvent} from "@mui/material/Select/SelectInput";
import { useEffect, useState } from 'react';

const GlobalSettingsContent = () => {
  const [selectedAction, setSelectedAction] = useState<Action>(DEFAULT_FILTER_ACTION);
  const [selectedColorTheme, setSelectedColorTheme] = useState<ColorTheme>(DEFAULT_COLOR_THEME);
  const actions = Object.values(Action);
  const colorThemes = Object.values(ColorTheme);

  useEffect(() => {
    const fetchData = async () => {
      const previous_action = await getFilterAction();
      setSelectedAction(previous_action);
      const previous_color_theme = await getColorTheme();
      setSelectedColorTheme(previous_color_theme);
    };
    fetchData();
  }, []);

  async function onActionChange(event: SelectChangeEvent<Action>) {
    const action = event.target.value as Action;
    setSelectedAction(action);
    await setFilterAction(action);
  }

  async function onColorThemeChange(event: SelectChangeEvent<ColorTheme>) {
    const colorTheme = event.target.value as ColorTheme;
    setSelectedColorTheme(colorTheme);
    await setColorTheme(colorTheme);
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
