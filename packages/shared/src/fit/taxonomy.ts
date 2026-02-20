/**
 * Taxonomy and synonym maps for fit classification.
 * Aligned with "AI Assessment Lab criteria": Device Type, Therapeutic Area, Clinical Modality, Ground Truth Sources.
 */

// Therapeutic Area (Excel)
export const ASSESSMENT_LAB_THERAPEUTIC_AREAS = [
  'Aortic Stenosis',
  'Atrial Fibrillation',
  'Cardio-Kidney-Metabolic Health',
  'Cardiogenic Shock',
  'Coronary Artery Disease',
  'Heart Failure',
  'Obesity',
  'Resuscitation',
  'Stroke',
] as const;

// Synonyms -> canonical therapeutic area (order: longer phrases first for matching)
// Normalize: AFib, CAD, CKM, echo/echocardiography, EKG, MRI, CT scan, X-ray, EMR/EHR, SaMD, predictive model
export const THERAPEUTIC_AREA_SYNONYMS: Record<string, string> = {
  'aortic valve stenosis': 'Aortic Stenosis',
  'aortic stenosis': 'Aortic Stenosis',
  'valve stenosis': 'Aortic Stenosis',
  'cardiac imaging': 'Aortic Stenosis', // often used with echo/valve context
  afib: 'Atrial Fibrillation',
  'a-fib': 'Atrial Fibrillation',
  'atrial fib': 'Atrial Fibrillation',
  'atrial fibrillation': 'Atrial Fibrillation',
  'afib detection': 'Atrial Fibrillation',
  cad: 'Coronary Artery Disease',
  'coronary artery disease': 'Coronary Artery Disease',
  ckm: 'Cardio-Kidney-Metabolic Health',
  'ckm health': 'Cardio-Kidney-Metabolic Health',
  cardiometabolic: 'Cardio-Kidney-Metabolic Health',
  'cardio-kidney-metabolic': 'Cardio-Kidney-Metabolic Health',
  'cardio kidney metabolic': 'Cardio-Kidney-Metabolic Health',
  'heart failure': 'Heart Failure',
  hf: 'Heart Failure',
  'cardiogenic shock': 'Cardiogenic Shock',
  obesity: 'Obesity',
  resuscitation: 'Resuscitation',
  stroke: 'Stroke',
  'acute stroke': 'Stroke',
};

// Clinical Modality (Excel): EMR/EHR, ECG/EKG, Echocardiogram, Computed Tomography (CT), Magnetic Resonance (MR), Xray/XR
export const ASSESSMENT_LAB_MODALITIES = [
  'EMR/EHR',
  'ECG/EKG',
  'Echocardiogram',
  'CT',
  'MR',
  'Xray/XR',
] as const;

export const MODALITY_SYNONYMS: Record<string, string> = {
  mri: 'MR',
  'magnetic resonance': 'MR',
  'mr imaging': 'MR',
  'ct scan': 'CT',
  'computed tomography': 'CT',
  ct: 'CT',
  'x-ray': 'Xray/XR',
  'x ray': 'Xray/XR',
  xray: 'Xray/XR',
  xr: 'Xray/XR',
  'ehr': 'EMR/EHR',
  emr: 'EMR/EHR',
  'ehr/emr': 'EMR/EHR',
  'emr/ehr': 'EMR/EHR',
  'electronic health record': 'EMR/EHR',
  'electronic medical record': 'EMR/EHR',
  'ehr integration': 'EMR/EHR',
  ecg: 'ECG/EKG',
  ekg: 'ECG/EKG',
  'ecg/ekg': 'ECG/EKG',
  'ecg and ekg': 'ECG/EKG',
  'ecg-based': 'ECG/EKG',
  'ekg-based': 'ECG/EKG',
  'electrocardiogram': 'ECG/EKG',
  'electrocardiograph': 'ECG/EKG',
  'ecg analysis': 'ECG/EKG',
  echocardiogram: 'Echocardiogram',
  echocardiography: 'Echocardiogram',
  echo: 'Echocardiogram',
  'echocardiogram analysis': 'Echocardiogram',
};

// Device Type (Excel): SaMD Predictive Algorithms
export const DEVICE_TYPE_SYNONYMS = [
  'samd',
  'software as a medical device',
  'software as medical device',
  'clinical prediction model',
  'clinical predictive model',
  'predictive algorithm',
  'predictive algorithms',
  'predictive model',
  'predictive models',
  'risk score',
  'risk prediction',
  'triage model',
  'triage algorithm',
  'diagnostic algorithm',
  'ml model',
  'machine learning model',
  'ai algorithm',
  'clinical decision support',
  'cds',
];

// Ground truth per Excel: EMR-Based Clinical Outcomes, Custom Expert Annotations/Labels
export const GROUND_TRUTH_SIGNALS = [
  'emr-based clinical outcomes',
  'emr based clinical outcomes',
  'custom expert annotations',
  'custom expert labels',
  'expert annotations',
  'expert labels',
  'emr',
  'ehr',
  'clinical outcomes',
  'emr-based clinical',
  'expert annotation',
  'expert label',
  'annotations',
  'labels',
  'clinical validation',
  'adjudication',
  'adjudicated',
  'ground truth',
  'reference standard',
  'chart review',
  'registry data',
  'registry dataset',
  'evaluation dataset',
  'labeled data',
  'gold standard',
];
