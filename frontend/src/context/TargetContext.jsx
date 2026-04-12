import React, { createContext, useContext, useState } from 'react';

const TargetContext = createContext();

export const TargetProvider = ({ children }) => {
  const [selectedUnits, setSelectedUnits] = useState([]);
  const [unitPayload, setUnitPayload] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [employeePayload, setEmployeePayload] = useState([]);

  //  ============UNIT TARGET DISTRIBUTION ========START==========
  const addUnit = (value, total) => {
    setSelectedUnits(value);
    const addedUnit = value.find((unit) => !selectedUnits.some((selectedUnit) => selectedUnit.id === unit.id));
    const removedUnit = selectedUnits.find((unit) => !value.some((selectedUnit) => selectedUnit.id === unit.id));

    if (addedUnit) {
      const newPayload = {
        unit_id: addedUnit.id,
        unit_name: addedUnit.name,
        total_target: total,
        parent_weight: '',
        child_weight: '',
        unit_targets: []
      };
      setUnitPayload((prevPayload) => [...prevPayload, newPayload]);
    }
    if (removedUnit) {
      const updatedPayload = unitPayload.filter((payload) => payload.unit_id !== removedUnit.id);
      setUnitPayload(updatedPayload);
    }
  };

  const handleUnitTargetChange = (event, parent_id, unit_id) => {
    const value = event.target.value;

    setUnitPayload((prevUnit) =>
      prevUnit.map((unit) => {
        if (unit.unit_id === unit_id) {
          // Check if target with parent_id already exists inside unit target
          const targetIndex = unit.unit_targets.findIndex((target) => target.parent_id === parent_id);

          // If target exists, update it; otherwise, add a new target
          const updatedUnitTargets =
            targetIndex !== -1
              ? unit.unit_targets.map((target, index) => (index === targetIndex ? { ...target, target: value } : target))
              : [...unit.unit_targets, { parent_id: parent_id, target: value, weight: '' }];

          return { ...unit, unit_targets: updatedUnitTargets };
        }
        return unit; // Ensure to return the unit if it doesn't match the unit_id
      })
    );
  };

  const handleParentWeightChange = (event, unit_id) => {
    const value = event.target.value;

    setUnitPayload((prevUnit) =>
      prevUnit.map((unit) => {
        if (unit.unit_id === unit_id) {
          return { ...unit, parent_weight: value };
        }
        return unit;
      })
    );
  };

  const handleUnitTargetCalculation = (targets, weight, unit_id) => {
    // Early return for invalid weight
    if (weight <= 0) return;

    setUnitPayload((prevUnits) =>
      prevUnits.map((unit) => {
        if (unit.unit_id === unit_id) {
          const calculatedTarget = (weight / 100) * unit.total_target;

          const updatedUnitTargets = targets.map((target, index) => {
            return { parent_id: targets[index].id, target: calculatedTarget };
          });

          return { ...unit, unit_targets: updatedUnitTargets };
        }
        return unit;
      })
    );
  };

  const handleUnitWeightChange = (event, unit_id) => {
    const value = event.target.value;

    setUnitPayload((prevUnit) =>
      prevUnit.map((unit) => {
        if (unit.unit_id === unit_id) {
          return { ...unit, child_weight: value };
        }
        return unit;
      })
    );
  };

  const removeUnit = (removedUnit) => {
    if (removedUnit) {
      const updatedPayload = unitPayload.filter((payload) => payload.unit_id != removedUnit.id);
      setUnitPayload(updatedPayload);
    }
  };

  const handleUnitTargetClone = (value, parent_id, unit_id) => {
    setUnitPayload((prevUnit) =>
      prevUnit.map((unit) => {
        if (unit.unit_id === unit_id) {
          // Check if target with parent_id already exists inside unit target
          const targetIndex = unit.unit_targets.findIndex((target) => target.parent_id === parent_id);

          // If target exists, update it; otherwise, add a new target
          const updatedUnitTargets =
            targetIndex !== -1
              ? unit.unit_targets.map((target, index) => (index === targetIndex ? { ...target, target: value } : target))
              : [...unit.unit_targets, { parent_id: parent_id, target: value, weight: '' }];

          return { ...unit, unit_targets: updatedUnitTargets };
        }
        return unit; // Ensure to return the unit if it doesn't match the unit_id
      })
    );
  };

  const handleCloningUnitTarget = (currentIndex, parent_id) => {
    if (currentIndex === 0) {
      if (unitPayload[0] && unitPayload[0]?.parent_weight && unitPayload[0]?.child_weight && unitPayload[0]?.unit_targets[0].target) {
        const target = unitPayload[0]?.unit_targets[0].target;

        const parentWeight = unitPayload[0]?.parent_weight;
        const childWeight = unitPayload[0]?.child_weight;

        unitPayload.forEach((theUnit) => {
          setUnitPayload((prevUnit) =>
            prevUnit.map((unit) => {
              if (unit.unit_id === theUnit.unit_id) {
                handleUnitTargetClone(target, parent_id, theUnit.unit_id);
                return { ...unit, parent_weight: parentWeight, child_weight: childWeight };
              }
              return unit;
            })
          );
        });
      } else {
        setError({ ...error, state: true, message: 'Make sure there is no empty field ' });
      }
    } else if (currentIndex > 0) {
      const target = unitPayload[0]?.unit_targets[currentIndex].target;

      if (target) {
        unitPayload.forEach((theUnit) => handleUnitTargetClone(target, parent_id, theUnit.unit_id));
      } else {
        setError({ ...error, state: true, message: 'Please set value for the first unit' });
      }
    } else {
      setError({ ...error, state: true, message: 'There is issue while cloning' });
    }
  };
  //  ============UNIT TARGET DISTRIBUTION ========END==========

  //  ============EMPLOYEE TARGET DISTRIBUTION ========START==========

  const addEmployee = (value, total) => {
    setSelectedEmployees(value);

    const addedEmployee = value.find((unit) => !selectedEmployees.some((selectedUnit) => selectedUnit.id === unit.id));
    const removeEmployee = selectedEmployees.find((unit) => !value.some((selectedUnit) => selectedUnit.id === unit.id));

    if (addedEmployee) {
      const newPayload = {
        unit_id: addedEmployee.id,
        unit_name: addedEmployee.user?.name,
        total_target: total,
        parent_weight: '',
        child_weight: '',
        unit_targets: []
      };
      setEmployeePayload((prevPayload) => [...prevPayload, newPayload]);
    }

    if (removeEmployee) {
      const updatedPayload = employeePayload.filter((payload) => payload.unit_id !== removeEmployee.id);
      setEmployeePayload(updatedPayload);
    }
  };

  const handleEmployeeTargetChange = (event, parent_id, unit_id) => {
    const value = event.target.value;

    setEmployeePayload((prevUnit) =>
      prevUnit.map((unit) => {
        if (unit.unit_id === unit_id) {
          // Check if target with parent_id already exists inside unit target
          const targetIndex = unit.unit_targets.findIndex((target) => target.parent_id === parent_id);

          // If target exists, update it; otherwise, add a new target
          const updatedUnitTargets =
            targetIndex !== -1
              ? unit.unit_targets.map((target, index) => (index === targetIndex ? { ...target, target: value } : target))
              : [...unit.unit_targets, { parent_id: parent_id, target: value }];

          return { ...unit, unit_targets: updatedUnitTargets };
        }
        return unit; // Ensure to return the unit if it doesn't match the unit_id
      })
    );
  };

  const handleEmployeeParentWeightChange = (event, unit_id) => {
    const value = event.target.value;

    setEmployeePayload((prevUnit) =>
      prevUnit.map((unit) => {
        if (unit.unit_id === unit_id) {
          return { ...unit, parent_weight: value };
        }
        return unit;
      })
    );
  };

  const handleEmployeeTargetCalculation = (targets, weight, unit_id) => {
    // Early return for invalid weight
    if (weight <= 0) return;

    setEmployeePayload((prevUnits) =>
      prevUnits.map((unit) => {
        if (unit.unit_id === unit_id) {
          const calculatedTarget = (weight / 100) * unit.total_target;

          const updatedUnitTargets = targets.map((target, index) => {
            return { parent_id: targets[index].id, target: calculatedTarget };
          });

          return { ...unit, unit_targets: updatedUnitTargets };
        }
        return unit;
      })
    );
  };

  const handleEmployeeWeightChange = (event, unit_id) => {
    const value = event.target.value;

    setEmployeePayload((prevUnit) =>
      prevUnit.map((unit) => {
        if (unit.unit_id === unit_id) {
          return { ...unit, child_weight: value };
        }
        return unit;
      })
    );
  };

  const handleEmployeeTargetClone = (value, parent_id, unit_id) => {
    setEmployeePayload((prevUnit) =>
      prevUnit.map((unit) => {
        if (unit.unit_id === unit_id) {
          // Check if target with parent_id already exists inside unit target
          const targetIndex = unit.unit_targets.findIndex((target) => target.parent_id === parent_id);

          // If target exists, update it; otherwise, add a new target
          const updatedUnitTargets =
            targetIndex !== -1
              ? unit.unit_targets.map((target, index) => (index === targetIndex ? { ...target, target: value } : target))
              : [...unit.unit_targets, { parent_id: parent_id, target: value, weight: '' }];

          return { ...unit, unit_targets: updatedUnitTargets };
        }
        return unit; // Ensure to return the unit if it doesn't match the unit_id
      })
    );
  };

  const handleCloningEmployeeTarget = (currentIndex, parent_id) => {
    if (currentIndex === 0) {
      if (
        employeePayload[0] &&
        employeePayload[0]?.parent_weight &&
        employeePayload[0]?.child_weight &&
        employeePayload[0]?.unit_targets[0].target
      ) {
        const target = employeePayload[0]?.unit_targets[0].target;
        const parentWeight = employeePayload[0]?.parent_weight;
        const childWeight = employeePayload[0]?.child_weight;

        employeePayload.forEach((theUnit) => {
          setEmployeePayload((prevUnit) =>
            prevUnit.map((unit) => {
              if (unit.unit_id === theUnit.unit_id) {
                handleEmployeeTargetClone(target, parent_id, theUnit.unit_id);
                return { ...unit, parent_weight: parentWeight, child_weight: childWeight };
              }
              return unit;
            })
          );
        });
      } else {
        setError({ ...error, state: true, message: 'Make sure there is no empty field ' });
      }
    } else if (currentIndex > 0) {
      const target = employeePayload[0]?.unit_targets[currentIndex].target;

      if (target) {
        employeePayload.forEach((theUnit) => handleEmployeeTargetClone(target, parent_id, theUnit.unit_id));
      } else {
        setError({ ...error, state: true, message: 'Please set value for the first unit' });
      }
    } else {
      setError({ ...error, state: true, message: 'There is issue while cloning' });
    }
  };

  const removeEmployee = (removedEmployee) => {
    if (removedEmployee) {
      const updatedPayload = employeePayload.filter((payload) => payload.unit_id !== removedEmployee.id);
      setEmployeePayload(updatedPayload);
    }
  };

  //  ============EMPLOYEE TARGET DISTRIBUTION ========END==========

  //  ====== TARGET DISTRIBUTION RESET STATE ===START===

  const handleResettingTarget = () => {
    setSelectedUnits([]);
    setUnitPayload([]);
    setSelectedEmployees([]);
    setEmployeePayload([]);
  };

  //  ======  TARGET DISTRIBUTION RESET STATE ===END===

  return (
    <TargetContext.Provider
      value={{
        unitPayload,
        selectedUnits,
        addUnit,
        handleUnitTargetChange,
        handleParentWeightChange,
        handleUnitTargetCalculation,
        handleUnitWeightChange,
        handleCloningUnitTarget,
        removeUnit,
        employeePayload,
        selectedEmployees,
        addEmployee,
        handleEmployeeTargetChange,
        handleEmployeeParentWeightChange,
        handleEmployeeTargetCalculation,
        handleEmployeeWeightChange,
        handleCloningEmployeeTarget,
        removeEmployee,
        handleResettingTarget
      }}
    >
      {children}
    </TargetContext.Provider>
  );
};

export const useTarget = () => useContext(TargetContext);
