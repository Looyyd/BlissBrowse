import {FilterAction, ColorTheme} from "../../modules/types"
import {MenuItem, Select, Tooltip} from "@mui/material";
import React from "react";
import {
  ColorThemeStore,
  FilterActionStore,
} from "../../modules/settings";
import {SelectChangeEvent} from "@mui/material/Select/SelectInput";
import Box from "@mui/material/Box";

const GlobalSettings = () => {
  const colorThemeStore = new ColorThemeStore();
  const filterActionStore = new FilterActionStore();
  const [selectedAction, setSelectedAction] = filterActionStore.useData();
  const [selectedColorTheme, setSelectedColorTheme] = colorThemeStore.useData();
  const filterActions = Object.values(FilterAction);
  const colorThemes = Object.values(ColorTheme);

  async function onActionChange(event: SelectChangeEvent<FilterAction>) {
    const action = event.target.value as FilterAction;
    await setSelectedAction(action);
  }

  async function onColorThemeChange(event: SelectChangeEvent<ColorTheme>) {
    const colorTheme = event.target.value as ColorTheme;
    await setSelectedColorTheme(colorTheme);
  }

  return (
    <Box display="flex" flexDirection="column" alignItems="flex-start">
      <Box mb={2}>
        <Tooltip title="Choose the default filter action, this will impact how filtered elements are modified">
          <Box mr={1}>
          <label id="filterActionSelect-label">Change Default Filter Action</label>
          </Box>
        </Tooltip>
        <Select
          labelId="filterActionSelect-label"
          id="filterActionSelect"
          value={selectedAction === null ? "" : selectedAction}
          onChange={onActionChange}
          disabled={filterActions.length === 0}
        >
          {filterActions.map((actionName) => (
            <MenuItem key={actionName} value={actionName}>
              {actionName}
            </MenuItem>
          ))}
        </Select>
      </Box>

      <Box mb={2}>
        <Tooltip title="Select the color theme for the extension option pages">
          <Box mr={1}>
          <label id="colorThemeSelect-label">Change Color Theme</label>
          </Box>
        </Tooltip>
        <Select
          labelId="colorThemeSelect-label"
          id="colorThemeSelect"
          value={selectedColorTheme === null ? "" : selectedColorTheme}
          onChange={onColorThemeChange}
          disabled={colorThemes.length === 0}
        >
          {colorThemes.map((colorThemeName) => (
            <MenuItem key={colorThemeName} value={colorThemeName}>
              {colorThemeName}
            </MenuItem>
          ))}
        </Select>
      </Box>
    </Box>
  );
};


export default GlobalSettings;
