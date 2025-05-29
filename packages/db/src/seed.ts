import { PrismaClient, ConnectorType, FundingStage, Stage } from '@prisma/client';

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

  // Seed connectors (RSS feeds) - check if exists first
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

  // Seed companies
  const companies = Array.from({ length: 15 }).map((_, i) => ({
    name: `HealthCo ${i + 1}`,
    website: `https://www.healthco${i + 1}.com`,
    description: 'Example digital health startup focused on AI-enabled care.',
    headquarters: 'USA',
    foundedYear: 2018 + (i % 5),
    specialties: i % 4 === 0 ? ['cardiovascular'] : i % 4 === 1 ? ['diagnostics'] : i % 4 === 2 ? ['remote patient monitoring'] : ['other'],
    fundingStage: [FundingStage.SEED, FundingStage.SERIES_A, FundingStage.PRE_SEED, FundingStage.SERIES_B, FundingStage.OTHER][i % 5],
    totalScore: Math.round((0.4 + (i % 6) * 0.08) * 100) / 100,
    stage: [Stage.NEW, Stage.QUALIFIED, Stage.OUTREACH][i % 3],
  }));

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

      // Signals per company (2-4)
      const count = 2 + (Math.floor(Math.random() * 3));
      const newsSourceUrls = [
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
      
      for (let s = 0; s < count; s++) {
        const url = newsSourceUrls[(s + companies.indexOf(c)) % newsSourceUrls.length];
        await prisma.signal.create({
          data: {
            companyId: company.id,
            sourceName: rssFeeds[(s + companies.indexOf(c)) % rssFeeds.length].name,
            sourceType: 'news',
            title: `${company.name} announces update ${s + 1}`,
            url,
            summary: 'Latest news and updates from healthcare industry sources.',
            publishedAt: new Date(Date.now() - (s + 1) * 86400000),
            raw: { example: true },
          },
        });
      }
    }
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

