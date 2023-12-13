import {FilterAction, ColorTheme} from "../../modules/types"
import {Container, MenuItem, Select, Tooltip} from "@mui/material";
import React from "react";
import {
  FilterActionStore, MLFilterMethodStore,
} from "../../modules/settings";
import {SelectChangeEvent} from "@mui/material/Select/SelectInput";
import Box from "@mui/material/Box";
import {useDataFromStore} from "../../modules/datastore";
import {MLFilterMethod} from "../../modules/ml/mlTypes";
import SelectFromEnum from "../style/SelectFromEnum";

//const colorThemeStore = new ColorThemeStore();
const filterActionStore = new FilterActionStore();
const mlFilterMethodStore = new MLFilterMethodStore()

const GlobalSettings = () => {
  const [selectedAction] = useDataFromStore(filterActionStore);
  const [selectedMLFilterMethod] = useDataFromStore(mlFilterMethodStore);
  //const [selectedColorTheme] = useDataFromStore(colorThemeStore);
  const filterActions = Object.values(FilterAction);
  //const colorThemes = Object.values(ColorTheme);

  async function onActionChange(event: SelectChangeEvent<string>) {
    const action = event.target.value as FilterAction;
    await filterActionStore.set(action);
  }

  async function onMLFilterMethodChange(event: SelectChangeEvent<string>) {
    const action = event.target.value as MLFilterMethod;
    await mlFilterMethodStore.set(action);
  }

  /*
  async function onColorThemeChange(event: SelectChangeEvent<ColorTheme>) {
    const colorTheme = event.target.value as ColorTheme;
    await colorThemeStore.set(colorTheme);
  }
   */

  return (
    <Container>
      <Box display="flex" flexDirection="column" alignItems="flex-start">
        <Box mb={2}>
          <Tooltip title="Choose the default filter action, this will impact how filtered elements are modified">
            <Box mr={1}>
              <label id="filterActionSelect-label">Change Default Filter Action</label>
            </Box>
          </Tooltip>
          <SelectFromEnum
            labelId="filterActionSelect-label"
            id="filterActionSelect"
            enumObj={FilterAction}
            onChange={onActionChange}
            value={selectedAction === null ? "" : selectedAction}
            />
        </Box>

        <Box mb={2}>
          <Tooltip title="Choose the default ML filter method, this will impact how filtered elements are modified">
            <Box mr={1}>
              <label id="mlFilterMethodSelect-label">Change Default ML Filter Method</label>
            </Box>
          </Tooltip>
          <SelectFromEnum
            labelId="mlFilterMethodSelect-label"
            id="mlFilterMethodSelect"
            enumObj={MLFilterMethod}
            onChange={onMLFilterMethodChange}
            value={selectedMLFilterMethod === null ? "" : selectedMLFilterMethod}
          />
        </Box>

        {/*
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
      */}
      </Box>
    </Container>
  );
};


export default GlobalSettings;
