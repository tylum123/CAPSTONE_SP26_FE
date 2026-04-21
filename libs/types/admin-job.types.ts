export interface AdminJobFarmer {
  id: string;
  fullName: string;
}

export interface AdminJobWorker {
  id: string;
  fullName: string;
}

export interface AdminJob {
  id: string;
  title: string;
  farmer: AdminJobFarmer;
  worker?: string;
  workersAccepted: number;
  workersNeeded: number;
  description: string;
  address: string;
  status: string;
  salary: number;
  startDate: string;
  endDate: string;
}

export interface AdminJobListResponse {
  data: AdminJob[];
  summary: {
    total: number;
    active: number;
    completed: number;
    completionRate: number;
  };
  total: number;
  page: number;
  limit: number;
}
