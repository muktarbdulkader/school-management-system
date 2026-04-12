import { useSelector } from 'react-redux';

export const FiscalYearValidation = () => {
  const SelectFiscalYear = useSelector((state) => state.customization.selectedFiscalYear);
  if (SelectFiscalYear?.id) {
    return true;
  } else {
    return false;
  }
};

export const SelectedKPIValidation = (selectedKpi) => {
  const errors = [];
  let valid = true;
  let totalWeight = 0;

  if (selectedKpi.length === 0) {
    valid = false;
    errors.push('Please select KPI before proceeding');
  }

  selectedKpi.forEach((kpi) => {
    // Validate weight
    if (kpi.weight === '') {
      valid = false;
      errors.push(`The ${kpi.name} KPI Weight is required.`);
    } else if (isNaN(kpi.weight)) {
      valid = false;
      errors.push(`The ${kpi.name} KPI weight must be a number.`);
    } else if (kpi.weight == 0) {
      valid = false;
      errors.push(`The ${kpi.name} KPI weight cannot be 0`);
    } else if (kpi.weight < 0) {
      valid = false;
      errors.push(`The ${kpi.name} KPI weight cannot be negative.`);
    } else if (kpi.weight > 100) {
      valid = false;
      errors.push(`The ${kpi.name} KPI Weight exceeded 100%`);
    } else {
      totalWeight += parseFloat(kpi.weight);
    }

    // Validate total_target
    if (kpi.total_target === '') {
      valid = false;
      errors.push(`The ${kpi.name} KPI target is not set.`);
    } else if (isNaN(kpi.total_target)) {
      valid = false;
      errors.push(`The ${kpi.name} KPI target should be a number.`);
    } else if (kpi.total_target == 0) {
      valid = false;
      errors.push(`The ${kpi.name} KPI target cannot be 0`);
    } else if (kpi.total_target < 0) {
      valid = false;
      errors.push(`The ${kpi.name} KPI target cannot be negative.`);
    }
  });

  if (totalWeight > 100) {
    valid = false;
    errors.push('The sum of KPI weights exceeded 100%.');
  }

  return { valid, errors };
};

export const FrequencyValidation = (selectedKpi) => {
  const errors = [];
  let valid = true;

  selectedKpi.forEach((kpi) => {
    if (!kpi.frequency_id) {
      valid = false;
      errors.push(`Please select the ${kpi.name} KPI evaluation frequency`);
    }
  });
  return { valid, errors };
};

export const DistributionValidation = (selectedKpi) => {
  const errors = [];
  let valid = true;

  selectedKpi.forEach((kpi) => {
    if (!kpi.targets) {
      valid = false;
      errors.push(`The ${kpi.name} KPI is not distributed`);
    } else {
      let targetSum = 0;
      kpi?.targets.forEach((period) => {
        if (!period.target || period.target === '') {
          valid = false;
          errors.push(`Please check ${kpi.name} KPI input fields, there is a period with missing value`);
        } else if (isNaN(period.target)) {
          valid = false;
          errors.push(`The ${kpi.name} KPI distributed target should be a number.`);
        }
        targetSum += parseFloat(period?.target);
      });

      if (targetSum < kpi?.total_target) {
        valid = false;
        errors.push(`The ${kpi.name} KPI total target is not fully distributed | distributed: ${targetSum} `);
      }
    }
  });

  return { valid, errors };
};

export const PlanningValidation = (kpiList) => {
  const errors = [];

  kpiList.forEach((kpi, index) => {
    if (!kpi.weight || kpi.weight === '') {
      errors.push(`KPI at index ${index} (${kpi.name}) does not have a weight set.`);
    }
    if (!kpi.total_target || kpi.total_target === '') {
      errors.push(`The total target is not set for (${kpi.name}) KPI`);
    }
    if (!kpi.targets || kpi.targets.length === 0) {
      errors.push(`KPI at index ${index} (${kpi.name}) does not have any target periods set.`);
    } else {
      // Check if target_period length matches f_value
      //   if (kpi.targets.length !== parseInt(kpi.f_value, 10)) {
      //     errors.push(`KPI at index ${index} (${kpi.name}) has ${kpi.targets.length} target periods but should have ${kpi.f_value}.`);
      //   }
      kpi.targets.forEach((period, periodIndex) => {
        if (!period.target || period.target === '') {
          errors.push(`The target distribution for (${kpi.name}), KPI is not set.`);
        }
      });
    }
  });

  return errors;
};
