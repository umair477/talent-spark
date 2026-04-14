let employeeSessionActive = false;

export function isEmployeeSessionActive() {
  return employeeSessionActive;
}

export function setEmployeeSessionActive(active: boolean) {
  employeeSessionActive = active;
}
