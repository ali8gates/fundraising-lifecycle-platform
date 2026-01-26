import { PrismaClient, ConnectorType, FundingStage, Stage } from '@prisma/client';

const prisma = new PrismaClient();

const REAL_HEALTHCARE_COMPANIES = [
  {
    name: 'Ro',
    website: 'https://www.ro.co',
    description: 'Telehealth platform for chronic conditions and wellness',
    headquarters: 'New York, NY',
    foundedYear: 2018,
    specialties: ['remote patient monitoring', 'diagnostics'],
    fundingStage: FundingStage.SERIES_C,
    fundingAmount: 500, // $500M Series C
    revenueAmount: 250,
  },
  {
    name: 'Livongo (Teladoc)',
    website: 'https://www.teladoc.com',
    description: 'Virtual care and chronic disease management',
    headquarters: 'Dallas, TX',
    foundedYear: 2002,
    specialties: ['remote patient monitoring', 'diagnostics'],
    fundingStage: FundingStage.GROWTH,
    fundingAmount: 0, // Public company
    revenueAmount: 1100,
  },
  {
    name: 'GlycoLeap',
    website: 'https://www.glypleap.com',
    description: 'AI-powered diabetes management platform',
    headquarters: 'San Francisco, CA',
    foundedYear: 2016,
    specialties: ['diagnostics', 'remote patient monitoring'],
    fundingStage: FundingStage.SERIES_B,
    fundingAmount: 45,
    revenueAmount: 12,
  },
  {
    name: 'Tempus',
    website: 'https://www.tempus.com',
    description: 'AI platform for oncology and cancer care',
    headquarters: 'Chicago, IL',
    foundedYear: 2015,
    specialties: ['diagnostics'],
    fundingStage: FundingStage.SERIES_D,
    fundingAmount: 300,
    revenueAmount: 80,
  },
  {
    name: 'HeartBeam',
    website: 'https://www.heartbeam.com',
    description: 'AI-enabled ECG analysis for cardiac diagnostics',
    headquarters: 'San Jose, CA',
    foundedYear: 2018,
    specialties: ['cardiovascular', 'diagnostics'],
    fundingStage: FundingStage.SERIES_B,
    fundingAmount: 28,
    revenueAmount: 5,
  },
  {
    name: 'CardioSignal',
    website: 'https://www.cardiosignal.ai',
    description: 'Cardiovascular disease prediction using AI',
    headquarters: 'Boston, MA',
    foundedYear: 2017,
    specialties: ['cardiovascular'],
    fundingStage: FundingStage.SERIES_A,
    fundingAmount: 8,
    revenueAmount: 2,
  },
  {
    name: 'Proteus Digital Health',
    website: 'https://www.proteusdigitalhealth.com',
    description: 'Digital medicines for medication adherence',
    headquarters: 'Redwood City, CA',
    foundedYear: 2003,
    specialties: ['remote patient monitoring'],
    fundingStage: FundingStage.GROWTH,
    fundingAmount: 150,
    revenueAmount: 30,
  },
  {
    name: 'Omada Health',
    website: 'https://www.omadahealth.com',
    description: 'Digital therapeutics for chronic disease prevention',
    headquarters: 'San Francisco, CA',
    foundedYear: 2010,
    specialties: ['remote patient monitoring', 'diagnostics'],
    fundingStage: FundingStage.SERIES_E,
    fundingAmount: 326,
    revenueAmount: 120,
  },
  {
    name: 'Zipline',
    website: 'https://flyzipline.com',
    description: 'Drone delivery for medical supplies',
    headquarters: 'San Francisco, CA',
    foundedYear: 2014,
    specialties: ['other'],
    fundingStage: FundingStage.SERIES_D,
    fundingAmount: 190,
    revenueAmount: 45,
  },
  {
    name: 'GoodRx',
    website: 'https://www.goodrx.com',
    description: 'Platform to find lowest prescription drug prices',
    headquarters: 'Pasadena, CA',
    foundedYear: 2011,
    specialties: ['other'],
    fundingStage: FundingStage.GROWTH,
    fundingAmount: 75,
    revenueAmount: 250,
  },
  {
    name: 'Guardant Health',
    website: 'https://www.guardanthealth.com',
    description: 'Liquid biopsy for cancer detection',
    headquarters: 'Redwood City, CA',
    foundedYear: 2010,
    specialties: ['diagnostics', 'cardiovascular'],
    fundingStage: FundingStage.GROWTH,
    fundingAmount: 0, // Public
    revenueAmount: 800,
  },
  {
    name: 'Clarify Medical',
    website: 'https://www.clarifymedical.com',
    description: 'AI for cardiac ultrasound image analysis',
    headquarters: 'Pleasanton, CA',
    foundedYear: 2018,
    specialties: ['cardiovascular', 'diagnostics'],
    fundingStage: FundingStage.SERIES_B,
    fundingAmount: 35,
    revenueAmount: 3,
  },
  {
    name: 'Propeller Health',
    website: 'https://www.propellerhealth.com',
    description: 'Digital respiratory care management',
    headquarters: 'Madison, WI',
    foundedYear: 2010,
    specialties: ['remote patient monitoring'],
    fundingStage: FundingStage.GROWTH,
    fundingAmount: 50,
    revenueAmount: 25,
  },
  {
    name: 'Vit (VitalConnect)',
    website: 'https://www.vit.com',
    description: 'Wearable remote patient monitoring',
    headquarters: 'San Jose, CA',
    foundedYear: 2008,
    specialties: ['remote patient monitoring', 'diagnostics'],
    fundingStage: FundingStage.SERIES_C,
    fundingAmount: 65,
    revenueAmount: 40,
  },
  {
    name: 'Butterfly Network',
    website: 'https://www.butterflynetwork.com',
    description: 'Portable ultrasound device powered by AI',
    headquarters: 'Guilford, CT',
    foundedYear: 2011,
    specialties: ['diagnostics'],
    fundingStage: FundingStage.SERIES_D,
    fundingAmount: 150,
    revenueAmount: 45,
  },
  {
    name: 'AliveCor',
    website: 'https://www.alivecor.com',
    description: 'Mobile ECG and AFib detection',
    headquarters: 'Mountain View, CA',
    foundedYear: 2011,
    specialties: ['cardiovascular', 'diagnostics'],
    fundingStage: FundingStage.SERIES_C,
    fundingAmount: 80,
    revenueAmount: 35,
  },
];

async function main() {
  console.log('Starting real data seed...');

  // App config
  await prisma.appConfig.upsert({
    where: { id: 1 },
    update: {
      weights: {
        ai: 0.30,
        market: 0.25,
        funding: 0.20,
        team: 0.15,
        regulatory: 0.10,
      },
      thresholds: {
        pass_to_review_threshold: 0.55,
        outreach_threshold: 0.70,
      },
    },
    create: {
      id: 1,
      weights: {
        ai: 0.30,
        market: 0.25,
        funding: 0.20,
        team: 0.15,
        regulatory: 0.10,
      },
      thresholds: {
        pass_to_review_threshold: 0.55,
        outreach_threshold: 0.70,
      },
    },
  });

  // Seed connectors
  const rssFeeds = [
    { name: 'MedCity News', url: 'https://medcitynews.com/feed/' },
    { name: 'MobiHealthNews', url: 'https://www.mobihealthnews.com/feed' },
    { name: 'FierceHealthcare', url: 'https://www.fiercehealthcare.com/rss.xml' },
    { name: 'Rock Health', url: 'https://rockhealth.com/feed/' },
    { name: 'CB Insights Health', url: 'https://www.cbinsights.com/research/tag/healthcare/feed/' },
    { name: 'FDA Press Releases', url: 'https://www.fda.gov/about-fda/contact-fda/stay-informed/rss-feeds/press-releases' },
    { name: 'NIH News Releases', url: 'https://www.nih.gov/news-events/news-releases/all.xml' },
    { name: 'HealthTech Magazine', url: 'https://healthtechmagazine.net/rss.xml' },
    { name: 'HIT Consultant', url: 'https://hitconsultant.net/feed/' },
    { name: 'Crunchbase News', url: 'https://news.crunchbase.com/feed/' }
  ];

  for (const feed of rssFeeds) {
    const existing = await prisma.connector.findFirst({ where: { name: feed.name } });
    if (!existing) {
      await prisma.connector.create({
        data: {
          name: feed.name,
          type: ConnectorType.rss,
          config: { url: feed.url },
          intervalMins: 120,
        },
      });
    }
  }

  console.log(`✓ ${rssFeeds.length} RSS feeds configured`);

  // Seed real companies
  for (const c of REAL_HEALTHCARE_COMPANIES) {
    const existing = await prisma.company.findFirst({ where: { name: c.name } });
    if (!existing) {
      const score = Math.random() * 0.6 + 0.4; // 0.4-1.0
      const company = await prisma.company.create({
        data: {
          name: c.name,
          website: c.website,
          description: c.description,
          headquarters: c.headquarters,
          foundedYear: c.foundedYear,
          specialties: c.specialties,
          fundingStage: c.fundingStage,
          fundingAmount: c.fundingAmount,
          revenueAmount: c.revenueAmount,
          totalScore: score,
          stage: score > 0.70 ? Stage.OUTREACH : score > 0.55 ? Stage.QUALIFIED : Stage.NEW,
        },
      });

      // Create score snapshot
      const weights = { ai: 0.3, market: 0.25, funding: 0.2, team: 0.15, regulatory: 0.1 };
      await prisma.scoreSnapshot.create({
        data: {
          companyId: company.id,
          aiSophistication: Math.random(),
          marketPotential: Math.random(),
          funding: Math.random(),
          team: Math.random(),
          regulatory: Math.random(),
          total: score,
          weights,
        },
      });

      // Create sample signals (news) with real healthcare news sources
      const newsSamples = [
        `${c.name} announces partnership with major healthcare provider`,
        `${c.name} receives FDA approval for new digital health feature`,
        `${c.name} expands to new markets in Asia Pacific`,
        `${c.name} launches AI-powered clinical tool`,
        `${c.name} partners with insurance company on pilot program`,
      ];
      
      const realNewsUrls = [
        'https://medcitynews.com/',
        'https://www.mobihealthnews.com/',
        'https://www.fiercehealthcare.com/',
        'https://rockhealth.com/',
        'https://www.cbinsights.com/research/',
        'https://www.fda.gov/news-events/',
        'https://www.nih.gov/news-events/news-releases/',
        'https://healthtechmagazine.net/',
        'https://hitconsultant.net/',
        'https://news.crunchbase.com/',
      ];

      for (let i = 0; i < 3; i++) {
        const title = newsSamples[i % newsSamples.length];
        const url = realNewsUrls[i % realNewsUrls.length];
        const existing = await prisma.signal.findFirst({ where: { url, companyId: company.id } });
        if (!existing) {
          await prisma.signal.create({
            data: {
              companyId: company.id,
              sourceName: rssFeeds[i % rssFeeds.length].name,
              sourceType: 'news',
              title,
              url,
              summary: `Latest news about ${c.name}`,
              publishedAt: new Date(Date.now() - (i + 1) * 7 * 86400000), // Weekly news
              raw: { company: c.name, index: i },
            },
          });
        }
      }
    }
  }

  console.log(`✓ ${REAL_HEALTHCARE_COMPANIES.length} real healthcare companies seeded`);
}

main()
  .then(() => {
    console.log('✓ Real data seed complete!');
  })
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });







