import { PrismaClient, ConnectorType, FundingStage, Stage, SourceType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
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

  // Seed connectors (RSS feeds) – live URLs that return valid article links; updated for 2024
  const rssFeeds = [
    { name: 'MedCity News', url: 'https://medcitynews.com/feed/' },
    { name: 'MobiHealthNews', url: 'https://www.mobihealthnews.com/feed' },
    { name: 'FierceHealthcare', url: 'https://www.fiercehealthcare.com/rss.xml' },
    { name: 'Rock Health', url: 'https://rockhealth.com/feed/' },
    { name: 'HealthTech Magazine', url: 'https://healthtechmagazine.net/rss.xml' },
    { name: 'HIT Consultant', url: 'https://hitconsultant.net/feed/' },
    { name: 'Crunchbase News', url: 'https://news.crunchbase.com/feed/' },
    { name: 'TechCrunch', url: 'https://techcrunch.com/feed/' },
    { name: 'VentureBeat', url: 'https://venturebeat.com/feed/' },
    { name: 'FDA Press Releases', url: 'https://www.fda.gov/about-fda/contact-fda/stay-informed/rss-feeds/press-releases/rss.xml' },
    { name: 'NIH Research Matters', url: 'https://www.nih.gov/news-events/nih-research-matters/rss-feed.xml' },
    { name: 'Healthcare IT News', url: 'https://www.healthcareitnews.com/rss.xml' },
    { name: 'STAT News', url: 'https://www.statnews.com/feed/' },
    { name: 'Becker\'s Hospital Review', url: 'https://www.beckershospitalreview.com/rss.xml' },
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

  // One example company that qualifies for AI Assessment Lab (so the badge is visible)
  const labExample = await prisma.company.findFirst({ where: { name: 'EchoPredict' } });
  if (!labExample) {
    const company = await prisma.company.create({
      data: {
        name: 'EchoPredict',
        website: 'https://echopredict.example.com',
        description:
          'SaMD predictive algorithm for aortic stenosis. Echocardiogram analysis and clinical decision support. EMR-based clinical outcomes and expert annotations for validation.',
        headquarters: 'USA',
        foundedYear: 2019,
        specialties: ['cardiovascular'],
        fundingStage: FundingStage.SERIES_A,
        fundingAmount: 12,
        totalScore: 0.72,
        stage: Stage.QUALIFIED,
      },
    });
    await prisma.signal.create({
      data: {
        companyId: company.id,
        sourceName: 'MedCity News',
        sourceType: SourceType.news,
        title: 'EchoPredict raises Series A for AI echocardiography',
        url: 'https://medcitynews.com/2024/echopredict-series-a/?ref=seed',
        summary: 'SaMD for aortic stenosis and echocardiogram analysis with clinical validation.',
        publishedAt: new Date(Date.now() - 7 * 86400000),
        raw: { seeded: true },
      },
    });
  }

  // Pipeline companies (good fit for Innovators Network / AI Assessment Lab) — from pipeline PDF
  const pipelineCompanies: Array<{ name: string; website: string; description: string; specialties: string[] }> = [
    {
      name: 'Idoven',
      website: 'https://idoven.ai',
      description:
        'ECG-AI for ATTR-CM and atrial fibrillation. AI for ECG analysis, predictive models. EHR integration, clinical validation, partnerships. AHA Scientific Sessions.',
      specialties: ['cardiovascular'],
    },
    {
      name: 'Ultromics',
      website: 'https://ultromics.com',
      description:
        'Echo AI for amyloidosis and aortic stenosis. AI-powered echocardiography, echocardiogram analysis, predictive algorithms, clinical decision support. Med device, partnerships.',
      specialties: ['cardiovascular'],
    },
    {
      name: 'Powerful Medical Inc.',
      website: 'https://powerfulmedical.com',
      description:
        'ECG-AI for heart failure. SaMD predictive algorithm, ECG/EKG analysis, pre-submission testing. Clinical validation, AHA case study, partnerships.',
      specialties: ['cardiovascular'],
    },
    {
      name: 'Brainomix',
      website: 'https://brainomix.com',
      description:
        'CT-AI for stroke. AI imaging, impact analysis, clinical decision support. Stroke detection, partnerships, med device.',
      specialties: ['cardiovascular'],
    },
    {
      name: 'Medicalgorithmics',
      website: 'https://medicalgorithmics.com',
      description:
        'CT-AI for stroke. Pre-submission testing, AI diagnostic algorithms. Chief Scientific Officer, AHA Scientific Sessions, partnerships.',
      specialties: ['cardiovascular'],
    },
    {
      name: 'Echo IQ',
      website: 'https://echoiq.com',
      description:
        'Echo AI, impact analysis. AI-assisted echocardiography, cardiovascular imaging. AHA Scientific Sessions, partnerships, med device.',
      specialties: ['cardiovascular'],
    },
    {
      name: 'Cerebria',
      website: 'https://cerebria.com',
      description:
        'AI impact analysis, clinical decision support. Healthcare AI, partnerships, AHA Ventures.',
      specialties: ['cardiovascular'],
    },
    {
      name: 'Riverain',
      website: 'https://riverain.com',
      description:
        'ClearRead CT, CT-AI. Impact analysis, clinical imaging AI. RSNA, partnerships, client expansion.',
      specialties: ['cardiovascular'],
    },
    {
      name: 'Fukuda Denshi',
      website: 'https://fukuda.com',
      description:
        'Medical device, ECG and cardiac diagnostics. AHA Scientific Sessions, partnerships.',
      specialties: ['cardiovascular'],
    },
    {
      name: 'GE Healthcare',
      website: 'https://gehealthcare.com',
      description:
        'Healthcare AI, medical imaging, ECG, echocardiography. Enterprise med device, partnerships, HLTH and AHA Sessions.',
      specialties: ['cardiovascular'],
    },
    {
      name: 'Philips',
      website: 'https://philips.com/healthcare',
      description:
        'Healthcare AI, medical imaging, patient monitoring. Enterprise med device, partnerships.',
      specialties: ['cardiovascular'],
    },
    {
      name: 'Siemens',
      website: 'https://siemens-healthineers.com',
      description:
        'Healthcare AI, medical imaging, CT, MR. Enterprise med device, partnerships.',
      specialties: ['cardiovascular'],
    },
    {
      name: 'Edwards',
      website: 'https://edwards.com',
      description:
        'Cardiovascular devices, structural heart. Enterprise med device, partnerships.',
      specialties: ['cardiovascular'],
    },
    {
      name: 'Samsung',
      website: 'https://samsung.com/healthcare',
      description:
        'Healthcare AI, medical imaging. Enterprise, HLTH, partnerships.',
      specialties: ['cardiovascular'],
    },
  ];

  for (const c of pipelineCompanies) {
    const existing = await prisma.company.findFirst({ where: { name: c.name } });
    if (!existing) {
      await prisma.company.create({
        data: {
          name: c.name,
          website: c.website,
          description: c.description,
          specialties: c.specialties,
          fundingStage: FundingStage.OTHER,
          totalScore: 0.6,
          stage: Stage.NEW,
        },
      });
    }
  }

  // Seed companies (with sample funding so Funding column shows data until Crunchbase runs)
  const companies = Array.from({ length: 15 }).map((_, i) => {
    const fundingStage = [FundingStage.SEED, FundingStage.SERIES_A, FundingStage.PRE_SEED, FundingStage.SERIES_B, FundingStage.OTHER][i % 5];
    const isRevenue = fundingStage === FundingStage.GROWTH || fundingStage === FundingStage.OTHER;
    return {
      name: `HealthCo ${i + 1}`,
      website: `https://www.healthco${i + 1}.com`,
      description: 'Example digital health startup focused on AI-enabled care.',
      headquarters: 'USA',
      foundedYear: 2018 + (i % 5),
      specialties: i % 4 === 0 ? ['cardiovascular'] : i % 4 === 1 ? ['diagnostics'] : i % 4 === 2 ? ['remote patient monitoring'] : ['other'],
      fundingStage,
      fundingAmount: isRevenue ? undefined : (2 + (i % 5) * 3),
      revenueAmount: isRevenue ? (5 + (i % 4) * 10) : undefined,
      totalScore: Math.round((0.4 + (i % 6) * 0.08) * 100) / 100,
      stage: [Stage.NEW, Stage.QUALIFIED][i % 2],
    };
  });

  for (const c of companies) {
    const existing = await prisma.company.findFirst({ where: { name: c.name } });
    if (!existing) {
      const company = await prisma.company.create({ data: { ...c } });

      // Score snapshots
      const ai = Math.random();
      const market = Math.random();
      const funding = Math.random();
      const team = Math.random();
      const regulatory = Math.random();
      const weights = { ai: 0.3, market: 0.25, funding: 0.2, team: 0.15, regulatory: 0.1 };
      const total = ai * weights.ai + market * weights.market + funding * weights.funding + team * weights.team + regulatory * weights.regulatory;

      await prisma.scoreSnapshot.create({
        data: {
          companyId: company.id,
          aiSophistication: ai,
          marketPotential: market,
          funding,
          team,
          regulatory,
          total,
          weights,
        },
      });

      // Seed a couple of example news signals per company with real article-style URLs
      const sampleNewsLinks = [
        {
          sourceName: 'MedCity News',
          url: 'https://medcitynews.com/2024/01/how-ai-is-reshaping-digital-health/',
        },
        {
          sourceName: 'TechCrunch',
          url: 'https://techcrunch.com/2024/01/15/healthtech-startups-ai-clinics/',
        },
        {
          sourceName: 'Rock Health',
          url: 'https://rockhealth.com/insights/digital-health-funding-trends-2024/',
        },
        {
          sourceName: 'Healthcare IT News',
          url: 'https://www.healthcareitnews.com/news/how-hospitals-are-using-ai-improve-care',
        },
      ];

      const newsCount = 2;
      for (let i = 0; i < newsCount; i++) {
        const link = sampleNewsLinks[(i + Math.floor(Math.random() * sampleNewsLinks.length)) % sampleNewsLinks.length];
        const uniqueUrl = link.url + (link.url.includes('?') ? '&' : '?') + `ref=${company.id}-${i}`;
        await prisma.signal.create({
          data: {
            companyId: company.id,
            sourceName: link.sourceName,
            sourceType: SourceType.news,
            title: `${company.name} mentioned in ${link.sourceName}`,
            url: uniqueUrl,
            summary: 'Example seeded news item for pilot demo. Live ingestion will add real items over time.',
            publishedAt: new Date(Date.now() - (i + 1) * 86400000),
            raw: { seeded: true },
          },
        });
      }
    }
  }

  // Ensure existing companies (e.g. from previous seed) also have Recent News links
  const sampleNewsLinks = [
    { sourceName: 'MedCity News', url: 'https://medcitynews.com/2024/01/how-ai-is-reshaping-digital-health/' },
    { sourceName: 'TechCrunch', url: 'https://techcrunch.com/2024/01/15/healthtech-startups-ai-clinics/' },
    { sourceName: 'Rock Health', url: 'https://rockhealth.com/insights/digital-health-funding-trends-2024/' },
    { sourceName: 'Healthcare IT News', url: 'https://www.healthcareitnews.com/news/how-hospitals-are-using-ai-improve-care' },
  ];
  const companiesNeedingSignals = await prisma.company.findMany({
    where: { name: { startsWith: 'HealthCo ' } },
    include: { _count: { select: { signals: true } } },
  });
  for (const company of companiesNeedingSignals) {
    const need = Math.max(0, 2 - company._count.signals);
    for (let i = 0; i < need; i++) {
      const link = sampleNewsLinks[i % sampleNewsLinks.length];
      const uniqueUrl = link.url + (link.url.includes('?') ? '&' : '?') + `ref=${company.id}-${i}`;
      await prisma.signal.create({
        data: {
          companyId: company.id,
          sourceName: link.sourceName,
          sourceType: SourceType.news,
          title: `${company.name} mentioned in ${link.sourceName}`,
          url: uniqueUrl,
          summary: 'Example seeded news item for pilot demo.',
          publishedAt: new Date(Date.now() - (i + 1) * 86400000),
          raw: { seeded: true },
        },
      });
    }
  }

  // Backfill funding for existing HealthCo companies so Funding column shows data
  const healthCos = await prisma.company.findMany({
    where: { name: { startsWith: 'HealthCo ' } },
  });
  for (const company of healthCos) {
    const isRevenue = company.fundingStage === FundingStage.GROWTH || company.fundingStage === FundingStage.OTHER;
    const needsFunding = isRevenue ? company.revenueAmount == null : company.fundingAmount == null;
    if (!needsFunding) continue;
    await prisma.company.update({
      where: { id: company.id },
      data: isRevenue
        ? { revenueAmount: 5 + (healthCos.indexOf(company) % 4) * 10 }
        : { fundingAmount: 2 + (healthCos.indexOf(company) % 5) * 3 },
    });
  }

  console.log('Seed complete');
}

main()
  .then(() => {
    console.log('✓ Database seeded successfully');
  })
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

