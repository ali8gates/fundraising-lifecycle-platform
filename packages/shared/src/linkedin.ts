/**
 * Types and interfaces for LinkedIn executive data
 */

export type LinkedInExecutive = {
  name: string;
  title: string;
  profileUrl: string;
  imageUrl?: string;
};

export type LinkedInExecutivesResponse = {
  success: boolean;
  executives: LinkedInExecutive[];
  source?: 'live' | 'mock'; // 'mock' indicates stub/placeholder data
  message?: string;
};



