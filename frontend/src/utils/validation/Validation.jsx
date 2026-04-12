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


