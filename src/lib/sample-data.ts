// Sample data for the productivity management system

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'hq_employee' | 'field_employee' | 'reporting_officer' | 'project_manager' | 'division_head' | 'top_management';
  department: string;
  division: string;
  avatar?: string;
  productivityScore: number;
}

export interface KPI {
  id: string;
  name: string;
  category: 'hq' | 'field';
  target: number;
  current: number;
  unit: string;
  weightage: number;
  measurementType: 'automatic' | 'manual';
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignee: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high' | 'critical';
  dueDate: string;
  createdAt: string;
  project?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  manager: string;
  status: 'planning' | 'active' | 'on_hold' | 'completed';
  progress: number;
  budget: number;
  spent: number;
  startDate: string;
  endDate: string;
  milestones: Milestone[];
}

export interface Milestone {
  id: string;
  name: string;
  dueDate: string;
  completed: boolean;
}

export interface PerformanceScore {
  month: string;
  score: number;
  measurableKPIs: number;
  qualitativeKPIs: number;
}

export const currentUser: User = {
  id: '1',
  name: 'Rajesh Kumar Singh',
  email: 'rajesh.singh@brahmaputra.gov.in',
  role: 'hq_employee',
  department: 'HQ Employee',
  division: 'Administration',
  productivityScore: 87,
};

export const sampleUsers: User[] = [
  currentUser,
  {
    id: '2',
    name: 'Priya Sharma',
    email: 'priya.sharma@brahmaputra.gov.in',
    role: 'field_employee',
    department: 'Field Employee',
    division: 'Flood Control',
    productivityScore: 92,
  },
  {
    id: '3',
    name: 'Amit Borah',
    email: 'amit.borah@brahmaputra.gov.in',
    role: 'project_manager',
    department: 'Project Manager',
    division: 'Construction',
    productivityScore: 85,
  },
  {
    id: '4',
    name: 'Sunita Devi',
    email: 'sunita.devi@brahmaputra.gov.in',
    role: 'reporting_officer',
    department: 'Reporting Officer',
    division: 'HR',
    productivityScore: 78,
  },
  {
    id: '5',
    name: 'Vikram Das',
    email: 'vikram.das@brahmaputra.gov.in',
    role: 'division_head',
    department: 'Division Head',
    division: 'Survey',
    productivityScore: 90,
  },
];

export const hqKPIs: KPI[] = [
  { id: '1', name: 'File Disposal Rate', category: 'hq', target: 95, current: 88, unit: '%', weightage: 25, measurementType: 'automatic' },
  { id: '2', name: 'Avg Turnaround Time', category: 'hq', target: 3, current: 2.5, unit: 'days', weightage: 20, measurementType: 'automatic' },
  { id: '3', name: 'Quality of Drafting', category: 'hq', target: 90, current: 85, unit: '%', weightage: 15, measurementType: 'manual' },
  { id: '4', name: 'Responsiveness', category: 'hq', target: 95, current: 92, unit: '%', weightage: 15, measurementType: 'automatic' },
  { id: '5', name: 'Digital Adoption', category: 'hq', target: 100, current: 95, unit: '%', weightage: 15, measurementType: 'automatic' },
  { id: '6', name: 'Attendance Compliance', category: 'hq', target: 98, current: 96, unit: '%', weightage: 10, measurementType: 'automatic' },
];

export const fieldKPIs: KPI[] = [
  { id: '7', name: 'DPR Preparation Timeliness', category: 'field', target: 100, current: 85, unit: '%', weightage: 20, measurementType: 'automatic' },
  { id: '8', name: 'Survey Accuracy', category: 'field', target: 98, current: 96, unit: '%', weightage: 20, measurementType: 'manual' },
  { id: '9', name: 'Physical Progress vs Milestones', category: 'field', target: 100, current: 78, unit: '%', weightage: 25, measurementType: 'automatic' },
  { id: '10', name: 'Budget Utilization Efficiency', category: 'field', target: 95, current: 88, unit: '%', weightage: 20, measurementType: 'automatic' },
  { id: '11', name: 'Technical Compliance', category: 'field', target: 100, current: 95, unit: '%', weightage: 15, measurementType: 'manual' },
];

export const sampleTasks: Task[] = [
  {
    id: '1',
    title: 'Review Annual Budget Proposal',
    description: 'Review and provide feedback on the FY 2024-25 budget proposal',
    assignee: 'Rajesh Kumar Singh',
    status: 'in_progress',
    priority: 'high',
    dueDate: '2024-01-15',
    createdAt: '2024-01-05',
  },
  {
    id: '2',
    title: 'Complete DPR for Embankment Project',
    description: 'Prepare detailed project report for the Majuli Embankment Strengthening project',
    assignee: 'Priya Sharma',
    status: 'pending',
    priority: 'critical',
    dueDate: '2024-01-20',
    createdAt: '2024-01-02',
    project: 'Majuli Embankment Project',
  },
  {
    id: '3',
    title: 'Staff Training Coordination',
    description: 'Coordinate digital literacy training for administrative staff',
    assignee: 'Sunita Devi',
    status: 'completed',
    priority: 'medium',
    dueDate: '2024-01-10',
    createdAt: '2024-01-01',
  },
  {
    id: '4',
    title: 'Site Survey - Dibrugarh Sector',
    description: 'Conduct ground survey for proposed anti-erosion works',
    assignee: 'Vikram Das',
    status: 'in_progress',
    priority: 'high',
    dueDate: '2024-01-18',
    createdAt: '2024-01-03',
    project: 'Dibrugarh Protection Works',
  },
  {
    id: '5',
    title: 'Quarterly Progress Report',
    description: 'Compile and submit Q3 progress report to the Ministry',
    assignee: 'Amit Borah',
    status: 'overdue',
    priority: 'critical',
    dueDate: '2024-01-08',
    createdAt: '2023-12-28',
  },
];

export const sampleProjects: Project[] = [
  {
    id: '1',
    name: 'Majuli Embankment Strengthening',
    description: 'Strengthening of existing embankments around Majuli Island',
    manager: 'Amit Borah',
    status: 'active',
    progress: 65,
    budget: 25000000,
    spent: 16250000,
    startDate: '2023-04-01',
    endDate: '2024-06-30',
    milestones: [
      { id: '1', name: 'Survey Completion', dueDate: '2023-06-30', completed: true },
      { id: '2', name: 'Material Procurement', dueDate: '2023-09-30', completed: true },
      { id: '3', name: 'Phase 1 Construction', dueDate: '2024-01-31', completed: false },
      { id: '4', name: 'Phase 2 Construction', dueDate: '2024-04-30', completed: false },
    ],
  },
  {
    id: '2',
    name: 'Dibrugarh Protection Works',
    description: 'Anti-erosion measures along Dibrugarh sector',
    manager: 'Vikram Das',
    status: 'active',
    progress: 42,
    budget: 18000000,
    spent: 7560000,
    startDate: '2023-07-01',
    endDate: '2024-09-30',
    milestones: [
      { id: '1', name: 'DPR Approval', dueDate: '2023-08-31', completed: true },
      { id: '2', name: 'Land Acquisition', dueDate: '2023-12-31', completed: false },
      { id: '3', name: 'Construction Start', dueDate: '2024-02-28', completed: false },
    ],
  },
  {
    id: '3',
    name: 'Digital Office Transformation',
    description: 'Implementation of paperless office and e-governance',
    manager: 'Rajesh Kumar Singh',
    status: 'active',
    progress: 78,
    budget: 5000000,
    spent: 3900000,
    startDate: '2023-01-01',
    endDate: '2024-03-31',
    milestones: [
      { id: '1', name: 'Infrastructure Setup', dueDate: '2023-03-31', completed: true },
      { id: '2', name: 'Staff Training', dueDate: '2023-06-30', completed: true },
      { id: '3', name: 'Full Deployment', dueDate: '2024-01-31', completed: false },
    ],
  },
];

export const performanceHistory: PerformanceScore[] = [
  { month: 'Jul', score: 78, measurableKPIs: 72, qualitativeKPIs: 85 },
  { month: 'Aug', score: 82, measurableKPIs: 80, qualitativeKPIs: 86 },
  { month: 'Sep', score: 79, measurableKPIs: 75, qualitativeKPIs: 88 },
  { month: 'Oct', score: 85, measurableKPIs: 84, qualitativeKPIs: 87 },
  { month: 'Nov', score: 88, measurableKPIs: 89, qualitativeKPIs: 85 },
  { month: 'Dec', score: 87, measurableKPIs: 86, qualitativeKPIs: 89 },
];

export const departmentPerformance = [
  { name: 'Administration', score: 89, employees: 15 },
  { name: 'Field Operations', score: 85, employees: 38 },
  { name: 'Finance & Accounts', score: 92, employees: 8 },
  { name: 'Planning & Design', score: 82, employees: 18 },
  { name: 'Projects Division', score: 91, employees: 22 },
  { name: 'Technical Division', score: 95, employees: 42 }
];

export const taskStatusDistribution = [
  { name: 'Completed', value: 45, color: 'hsl(var(--success))' },
  { name: 'In Progress', value: 30, color: 'hsl(var(--info))' },
  { name: 'Pending', value: 18, color: 'hsl(var(--warning))' },
  { name: 'Overdue', value: 7, color: 'hsl(var(--destructive))' },
];
