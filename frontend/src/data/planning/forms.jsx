import FrequencySelection from 'views/planning/components/Forms/Frequency';
import KPISelection from 'views/planning/components/Forms/KPISelection';
import TargetDistribution from 'views/planning/components/Forms/TargetDistribution';

export const CreatePlanForms = [
  {
    id: 1,
    name: 'Select KPI',
    component: <KPISelection />,
  },
  {
    id: 2,
    name: 'Frequency',
    component: <FrequencySelection />,
  },
  {
    id: 3,
    name: 'Target Distribution',
    component: <TargetDistribution />,
  },
];

export const UpdatePlanForm = (isUpdate, amended) => [
  {
    id: 1,
    name: 'Edit KPI Weight and Target',
    component: <KPISelection isUpdate={isUpdate} amending={amended} />,
  },
  {
    id: 2,
    name: 'Frequency',
    component: <FrequencySelection isUpdate={isUpdate} />,
  },
  {
    id: 3,
    name: 'Edit Target Distribution',
    component: <TargetDistribution isUpdate={isUpdate} />,
  },
];
