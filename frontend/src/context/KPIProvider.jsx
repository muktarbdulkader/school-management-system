import React, { createContext, useState, useContext } from 'react';

const KPIContext = createContext();

export const KPIProvider = ({ children }) => {
  const [selectedKpi, setSelectedKpi] = useState([]);
  const [selectedPerspective, setSelectedPerspective] = useState(null);
  const [selectedObjective, setSelectedObjective] = useState(null);

  const addOrRemoveKPI = (kpi) => {
    setSelectedKpi((prev) => {
      const isExisting = prev.find((item) => item.id === kpi.id);
      if (isExisting) {
        // Remove existing KPI
        return prev.filter((item) => item.id !== kpi.id);
      } else {
        // Add new KPI

        const newPayload = {
          id: kpi.id,
          name: kpi.name,
          parent_weight: '',
          weight: '',
          mu: kpi.measuring_unit?.name,
          variation_category: kpi.variation_category,
          total_target: '',
          objective: ''
        };
        return [...prev, newPayload];
      }
    });
  };

  const handleUpdatePlan = (kpi) => {
    setSelectedKpi(kpi);
  };

  const updateKPI = (id, updates) => {
    setSelectedKpi((prev) => {
      return prev.map((kpi) => (kpi.id === id ? { ...kpi, ...updates } : kpi));
    });
  };

  const distributeTarget = (value, kpi_id, period_id) => {
    setSelectedKpi((prevSelectedKpi) =>
      prevSelectedKpi.map((kpi) => {
        if (kpi.id === kpi_id) {
          if (kpi.targets) {
            const periodExists = kpi.targets.some((targeted) => targeted.period_id === period_id);
            const newTargetPeriod = periodExists
              ? kpi.targets.map((targeted) => (targeted.period_id === period_id ? { ...targeted, target: value } : targeted))
              : [...kpi.targets, { period_id: period_id, target: value }];
            return { ...kpi, targets: newTargetPeriod };
          } else {
            return { ...kpi, targets: [{ period_id: period_id, target: value }] };
          }
        }
        return kpi;
      })
    );
  };

  const handleValueSelection = (field, value) => {
    if (field === 'perspective' && selectedPerspective?.id !== value?.id) {
      setSelectedPerspective(value);
      setSelectedKpi([]);
    } else if (field === 'objective') {
      setSelectedObjective(value);
    }
  };

  const handleValueRemoval = (field) => {
    if (field === 'perspective') {
      setSelectedPerspective(null);
      setSelectedObjective(null);
    } else if (field === 'objective') {
      setSelectedObjective(null);
    }
  };

  return (
    <KPIContext.Provider
      value={{
        selectedKpi,
        selectedPerspective,
        selectedObjective,
        setSelectedObjective,
        addOrRemoveKPI,
        handleUpdatePlan,
        updateKPI,
        distributeTarget,
        handleValueSelection,
        handleValueRemoval
      }}
    >
      {children}
    </KPIContext.Provider>
  );
};

export const useKPI = () => useContext(KPIContext);
