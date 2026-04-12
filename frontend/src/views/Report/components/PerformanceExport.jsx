import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export const handleExcelExport = async (data) => {
  const formattedData = await handleMakingDataExportready(data);

  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'performances');
  const excelBuffer = XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'array'
  });
  const fileData = new Blob([excelBuffer], {
    type: 'application/octet-stream'
  });
  saveAs(fileData, 'performance.xlsx');
};

const handleMakingDataExportready = async (performances) => {
  const formattedData = performances.map((item) => {
    const periodName = Object.keys(item)[0];

    return {
      Name: item[periodName]?.name,
      Performance: item[periodName]?.overall,
      Is_Evaluated: item[periodName]?.is_evaluated,
      Scale: item[periodName]?.scale
    };
  });

  return formattedData;
};

//  =========PER KPI PERFORMANCE REPORT=======START============

export const handlePerKPIExcelExport = async (data) => {
  const formattedData = await handlePerKPIDataFormatting(data);

  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'per_kpi_performances');
  const excelBuffer = XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'array'
  });
  const fileData = new Blob([excelBuffer], {
    type: 'application/octet-stream'
  });
  saveAs(fileData, 'per_kpi_performance.xlsx');
};

const handlePerKPIDataFormatting = async (performances) => {
  const formattedData = performances.map((item) => {
    return {
      Kpi_Name: item?.name,
      Target: item?.target,
      Achieved: item?.actual_value,
      Performance: item?.kpi_performance
    };
  });

  return formattedData;
};
