import { NextResponse } from 'next/server';
import { prisma } from '@chti/db';
import type { LinkedInExecutivesResponse, LinkedInExecutive } from '@chti/shared';

/**
 * Fetch company executives using Clearbit API
 * 
 * Clearbit endpoint: https://company.clearbit.com/v1/domains/lookup?domain=example.com
 * 
 * Returns executives with names, titles, and LinkedIn profile URLs
 */
async function fetchClearbitExecutives(domain: string): Promise<LinkedInExecutive[]> {
  const apiKey = process.env.CLEARBIT_API_KEY;
  
  if (!apiKey) {
    console.warn('CLEARBIT_API_KEY not set - falling back to mock data');
    return [];
  }

  try {
    // Call Clearbit Company Enrichment API
    const response = await fetch(`https://company.clearbit.com/v1/domains/lookup?domain=${domain}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log(`Clearbit: No data found for domain ${domain}`);
        return [];
      }
      throw new Error(`Clearbit API error: ${response.status}`);
    }

    const data = await response.json();

    // Extract executives from the response
    // Clearbit returns leadership info in the company data
    const executives: LinkedInExecutive[] = [];

    // Clearbit's company object may include linked entities or separate leadership endpoint
    // For this implementation, we parse the company object if it contains leadership data
    if (data.leadership && Array.isArray(data.leadership)) {
      data.leadership.slice(0, 5).forEach((exec: any) => {
        executives.push({
          name: `${exec.firstName} ${exec.lastName}`.trim(),
          title: exec.title || 'Unknown Position',
          profileUrl: exec.linkedinUrl || `https://linkedin.com/in/${exec.firstName}-${exec.lastName}`.toLowerCase(),
          imageUrl: exec.imageUrl,
        });
      });
    }

    return executives;
  } catch (error) {
    console.error('Clearbit API error:', error);
    return [];
  }
}

/**
 * Fallback: Return mock executives if API not available
 */
const getMockExecutives = (): LinkedInExecutive[] => {
  return [
    {
      name: 'Jane Doe',
      title: 'Chief Executive Officer',
      profileUrl: 'https://linkedin.com/in/janedoe',
      imageUrl: 'https://media.licdn.com/...',
    },
    {
      name: 'John Smith',
      title: 'Chief Technology Officer',
      profileUrl: 'https://linkedin.com/in/johnsmith',
      imageUrl: 'https://media.licdn.com/...',
    },
    {
      name: 'Sarah Johnson',
      title: 'VP of Product',
      profileUrl: 'https://linkedin.com/in/sarahjohnson',
      imageUrl: 'https://media.licdn.com/...',
    },
    {
      name: 'Michael Chen',
      title: 'VP of Engineering',
      profileUrl: 'https://linkedin.com/in/michaelchen',
      imageUrl: 'https://media.licdn.com/...',
    },
    {
      name: 'Emily Rodriguez',
      title: 'Chief Financial Officer',
      profileUrl: 'https://linkedin.com/in/emilyrodriguez',
      imageUrl: 'https://media.licdn.com/...',
    },
  ];
};

/**
 * Fetch LinkedIn executives for a company
 * 
 * GET /api/companies/:id/linkedin-executives
 * 
 * Supports:
 * 1. Clearbit API (if CLEARBIT_API_KEY env var set)
 * 2. Mock data (fallback)
 * 
 * Returns:
 * {
 *   "success": true,
 *   "executives": [...],
 *   "source": "clearbit" | "mock"
 * }
 */
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    // Fetch company details
    const company = await prisma.company.findUnique({
      where: { id: params.id },
    });

    if (!company) {
      return NextResponse.json(
        {
          success: false,
          executives: [],
          message: 'Company not found',
        } as LinkedInExecutivesResponse,
        { status: 404 }
      );
    }

    if (!company.website) {
      return NextResponse.json(
        {
          success: true,
          executives: getMockExecutives(),
          source: 'mock',
          message: 'No website found - using mock data',
        } as LinkedInExecutivesResponse
      );
    }

    // Extract domain from website URL
    let domain = company.website;
    if (domain.startsWith('http://') || domain.startsWith('https://')) {
      domain = new URL(domain).hostname || domain;
    }

    // Try Clearbit API first
    const clearbitData = await fetchClearbitExecutives(domain);
    
    if (clearbitData.length > 0) {
      return NextResponse.json({
        success: true,
        executives: clearbitData.slice(0, 5),
        source: 'clearbit',
      } as LinkedInExecutivesResponse);
    }

    // Fallback to mock data
    return NextResponse.json({
      success: true,
      executives: getMockExecutives(),
      source: 'mock',
      message: 'Clearbit data not available - using mock data',
    } as LinkedInExecutivesResponse);
  } catch (error) {
    console.error('Error fetching LinkedIn executives:', error);
    return NextResponse.json(
      {
        success: false,
        executives: [],
        message: 'Failed to fetch executives',
      } as LinkedInExecutivesResponse,
      { status: 500 }
    );
  }
}



