import {Action} from "../modules/types"
import {MenuItem, Select} from "@mui/material";
import {DEFAULT_FILTER_ACTION} from "../constants";
import React from "react";
import {getFilterAction, setFilterAction} from "../modules/settings";
import {SelectChangeEvent} from "@mui/material/Select/SelectInput";
import { useEffect, useState } from 'react';

const GlobalSettingsContent = () => {
  const [selectedAction, setSelectedAction] = useState<Action>(DEFAULT_FILTER_ACTION);
  const actions = Object.values(Action);

  useEffect(() => {
    const fetchData = async () => {
      const previous_action = await getFilterAction();
      setSelectedAction(previous_action);
    };
    fetchData();
  }, []);

  async function onActionChange(event: SelectChangeEvent<Action>) {
    const action = event.target.value as Action;
    setSelectedAction(action);
    await setFilterAction(action);
  }

  return (
    <Select
      labelId="customWordListSelect-label"
      id="customWordListSelect"
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
  )
}

export default GlobalSettingsContent;
