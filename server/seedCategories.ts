import { DynamicJobCategory } from '../src/types';

export const INITIAL_DYNAMIC_CATEGORIES: DynamicJobCategory[] = [
  {
    id: 'cat-healthcare',
    name: 'Healthcare & Medical',
    nameHi: 'स्वास्थ्य सेवा एवं चिकित्सा',
    icon: 'Stethoscope',
    description: 'Hospitals, clinics, diagnostic centers, pharmacies and home care staffing',
    subCategories: [
      'Medical Line Jobs',
      'Hospital Staff',
      'Staff Nurse (GNM/B.Sc)',
      'Medical Assistant',
      'Lab Technician (DMLT)',
      'Pharmacy Assistant / Pharmacist',
      'Healthcare Support / Patient Care',
      'Ward Boy / Ayah',
      'Dental Assistant',
      'Home Care Attendant',
      'Radiology / X-Ray Technician',
      'OT Technician'
    ],
    isActive: true,
    order: 1,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z'
  },
  {
    id: 'cat-skilled-trades',
    name: 'Skilled Trades & Technical',
    nameHi: 'कुशल व्यापार एवं तकनीकी',
    icon: 'Wrench',
    description: 'Licensed technicians, electricians, plumbers, fitters, carpenters and appliances',
    subCategories: [
      'Plumber',
      'Electrician (Commercial/Domestic)',
      'Carpenter & Woodworker',
      'AC & Refrigeration Technician',
      'Appliance Technician (TV/Washing Machine)',
      'Maintenance Technician',
      'Industrial Electrician',
      'Welder / Fabricator (TIG/MIG)',
      'Fitter & Machinist',
      'CNC / VMC Operator',
      'Solar Panel Installer',
      'Elevator / Lift Technician'
    ],
    isActive: true,
    order: 2,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z'
  },
  {
    id: 'cat-household-service',
    name: 'Household & Facility Service',
    nameHi: 'घरेलू एवं सुविधा सेवाएँ',
    icon: 'Sparkles',
    description: 'Housekeeping, domestic help, professional cleaning, hotel and corporate facilities',
    subCategories: [
      'Maid & Domestic Helper',
      'Deep Cleaning Staff',
      'Housekeeping Attendant',
      'Hotel Housekeeping Staff',
      'Office Cleaning & Pantry Staff',
      'Facility Management Associate',
      'Cook / Chef (Home/Commercial)',
      'Babysitter / Nanny',
      'Gardener / Landscaping Staff',
      'Laundromat / Ironing Staff',
      'Sanitation / Waste Management Staff'
    ],
    isActive: true,
    order: 3,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z'
  },
  {
    id: 'cat-driver-logistics',
    name: 'Drivers, Delivery & Logistics',
    nameHi: 'ड्राइवर, डिलीवरी एवं लॉजिस्टिक्स',
    icon: 'Truck',
    description: 'Commercial fleet, two-wheeler express delivery, warehouse, e-commerce supply chain',
    subCategories: [
      'Commercial Heavy Vehicle Driver (HTV)',
      'Commercial Light Vehicle Driver (LMV)',
      'Cab / Private Chauffeur',
      'Auto / E-Rickshaw Pilot',
      'E-Commerce Delivery Executive',
      'Food / Grocery Delivery Rider',
      'Warehouse Associate / Packer',
      'Forklift & Reach Truck Operator',
      'Inventory & Dispatch Executive',
      'Logistics Hub Coordinator'
    ],
    isActive: true,
    order: 4,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z'
  },
  {
    id: 'cat-security-field',
    name: 'Security & Field Operations',
    nameHi: 'सुरक्षा एवं फील्ड ऑपरेशंस',
    icon: 'ShieldCheck',
    description: 'Guarding, patrol supervisors, verification executives, field surveys and meter inspection',
    subCategories: [
      'Security Guard (Armed/Unarmed)',
      'Security Supervisor / Field Officer',
      'Event Bouncer / PSO',
      'Field Background Verification Agent',
      'Utility Meter Reader / Field Surveyor',
      'Pest Control Field Technician',
      'ATM Cash Loading Guard / Custodian'
    ],
    isActive: true,
    order: 5,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z'
  },
  {
    id: 'cat-it-tech',
    name: 'Information Technology (IT) & Software',
    nameHi: 'सूचना प्रौद्योगिकी (IT) एवं सॉफ्टवेयर',
    icon: 'Code',
    description: 'Engineering, web development, data, cloud, mobile apps and tech infrastructure',
    subCategories: [
      'Full Stack Developer (React / Node / Python)',
      'Frontend Engineer (React / Next.js / Vue)',
      'Backend Engineer (Java / Python / Go / Node)',
      'Mobile App Developer (Flutter / React Native / Android)',
      'QA & Automation Test Engineer',
      'Data Analyst / Business Intelligence',
      'DevOps & Cloud Engineer (AWS / GCP / Azure)',
      'UI/UX Designer',
      'IT Support & System Administrator',
      'Cybersecurity Specialist'
    ],
    isActive: true,
    order: 6,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z'
  },
  {
    id: 'cat-corporate-admin',
    name: 'Corporate, HR & Operations',
    nameHi: 'कॉर्पोरेट, एचआर एवं संचालन',
    icon: 'Briefcase',
    description: 'Human resources, finance, accounts, compliance, data entry and office coordination',
    subCategories: [
      'HR Executive / Talent Acquisition',
      'Accountant & Tally / GST Executive',
      'Billing & Invoice Specialist',
      'Data Entry Operator / MIS Executive',
      'Executive Assistant / Office Admin',
      'Operations Associate',
      'Legal & Compliance Assistant',
      'Content Writer & Copywriter'
    ],
    isActive: true,
    order: 7,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z'
  },
  {
    id: 'cat-sales-retail',
    name: 'Sales, Marketing & Customer Support',
    nameHi: 'बिक्री, मार्केटिंग एवं ग्राहक सहायता',
    icon: 'TrendingUp',
    description: 'B2B sales, BPO voice/non-voice, retail stores, digital growth and telecalling',
    subCategories: [
      'B2B / Corporate Sales Executive',
      'Field Sales Executive (FOS)',
      'Telecaller / Telesales Associate',
      'Customer Support Executive (Voice / Chat)',
      'Retail Store Sales Assistant',
      'Cashier & POS Billing Staff',
      'Digital Marketing Specialist (SEO/SEM/Meta)',
      'Business Development Associate (BDA)'
    ],
    isActive: true,
    order: 8,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z'
  },
  {
    id: 'cat-manufacturing-construction',
    name: 'Manufacturing, Factory & Construction',
    nameHi: 'विनिर्माण, फैक्ट्री एवं निर्माण',
    icon: 'Building2',
    description: 'Plant operations, assembly line, quality testing, construction masonry and civil work',
    subCategories: [
      'Assembly Line Operator',
      'Quality Control (QC) Inspector',
      'Civil Site Supervisor',
      'Mason & Bricklayer',
      'Commercial Painter & Wall Finisher',
      'Plant Maintenance Helper',
      'Safety Officer (HSE)',
      'Storekeeper / Material Inward Clerk'
    ],
    isActive: true,
    order: 9,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z'
  }
];
