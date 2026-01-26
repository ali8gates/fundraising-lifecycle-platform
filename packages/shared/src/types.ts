export type SourceType = 'news' | 'social' | 'funding' | 'site';

export type Signal = {
  source_name: string;
  source_type: SourceType;
  title: string;
  url: string;
  summary?: string;
  published_at?: string; // ISO
  raw_json: unknown;
};

export type Specialty = 'cardiovascular' | 'diagnostics' | 'remote patient monitoring' | 'other';

export type ScoreFactors = {
  ai_sophistication: number;
  market_potential: number;
  funding_stage: number;
  team_expertise: number;
  regulatory_positioning: number;
};

export type ScoreWeights = {
  ai: number;
  market: number;
  funding: number;
  team: number;
  regulatory: number;
};

export type Thresholds = {
  pass_to_review_threshold: number;
  outreach_threshold: number;
};

export type DataSourceConfig = {
  name: string;
  type: 'crunchbase' | 'angellist' | 'rss' | 'sec' | 'pitchbook';
  enabled: boolean;
  apiKey?: string;
  refreshIntervalMins?: number;
  lastRunAt?: string;
};

