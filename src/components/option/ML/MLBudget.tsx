import {useDataStore} from "../../DataStoreContext";
import {useDataFromStore} from "../../../modules/datastore";
import {useAlert} from "../../AlertContext";
import React, {useEffect, useState} from "react";
import {Button, TextField, Typography} from "@mui/material";
import {Save} from "@mui/icons-material";
import PaperBlissBrowse from "../../style/PaperBlissBrowse";


function displayCost(cost:number) {
  const roundedCost = cost.toFixed(2);
  if (cost > 0 && roundedCost === '0.00') {
    return `Current Period Cost: Less than $0.01`;
  }
  return `Current Period Cost: $${roundedCost}`;
}


const MLBudget = () => {
  const { mlCostStore } = useDataStore();
  const [mlCost] = useDataFromStore(mlCostStore);
  const [budgetLimit, setBudgetLimit] = useState(mlCost?.budgetLimit?.toString() || '');
  const { showAlert } = useAlert();

  useEffect(() => {
    setBudgetLimit(mlCost?.budgetLimit?.toString() || '');
  }, [mlCost]);

  const handleBudgetChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setBudgetLimit(event.target.value);
  };

  const handleSave = () => {
    let limit;
    if(budgetLimit === '') {
      limit = undefined;
    } else {
      limit = parseFloat(budgetLimit);
      if(isNaN(limit)) {
        showAlert("error", 'Budget limit must be a number');
        return;
      }
    }

    mlCostStore.setBudgetLimit(limit).then(() => {
      showAlert("success", 'Budget limit updated successfully!');
    }).catch((e) => {
      showAlert("error", 'An error occurred while updating budget limit');
      console.error('Error updating budget limit:', e);
    });
  }

  const handleReset = () => {
    // Implement logic to reset the cost
    mlCostStore.resetCost().then(() => {
      showAlert("success", 'Cost reset successfully!');
    }).catch((e) => {
      showAlert("error", 'An error occurred while resetting cost');
      console.error('Error resetting cost:', e);
    });
  };

  if (mlCost === null) {
    return <div>Loading</div>;
  }

  return (
    <PaperBlissBrowse >
      <Typography variant="h5">Machine Learning Cost Management</Typography>
      <Typography variant="body1">
        {displayCost(mlCost.cost)}
      </Typography>
      <Button
        variant="contained"
        color="primary"
        onClick={handleReset}
        style={{ marginTop: '10px' }}
      >
        Reset Cost
      </Button>
      <Typography variant="body1">
        Last Reset Date: {new Date(mlCost.lastResetDate).toLocaleDateString()}
        <br />
        Period Cost Reset Interval: {mlCost.resetInterval}
      </Typography>
      <TextField
        label="Set Budget Limit (in $)"
        type="number"
        value={budgetLimit}
        onChange={handleBudgetChange}
        placeholder="Enter budget limit or leave empty for no limit"
        fullWidth
        margin="normal"
      />
      <Button variant="contained" color="primary" onClick={handleSave} startIcon={<Save/>}>
        Save budget limit
      </Button>
    </PaperBlissBrowse>
  );
};

export default MLBudget;

