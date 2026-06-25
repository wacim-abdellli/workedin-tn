import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Load .env.local manually
function loadEnvFile(filePath) {
  try {
    const content = readFileSync(filePath, 'utf8');
    for (const line of content.split('\n')) {
      const match = line.match(/^([^#=\s]+)\s*=\s*"?([^"]*)"?\s*$/);
      if (match) {
        process.env[match[1]] = match[2];
      }
    }
  } catch {
    // file may not exist
  }
}

// Load env from project root
loadEnvFile(resolve(process.cwd(), '.env.local'));
loadEnvFile(resolve(process.cwd(), '.env'));

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://wvgkezmboewtlpnyjnyd.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('❌ SERVICE_ROLE_KEY not found in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const CLIENT_ID = 'b0098849-151a-4640-a947-f100192b5da0'; // wassim abdelli (Client)

const FREELANCERS = [
  {
    id: 'e229310c-48a5-4529-8d87-aa148fb0b524',
    name: 'Zouhour Abdelli',
    email: 'zouhourabdelli.dev@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&auto=format&fit=crop&q=80',
    title: 'Senior Full Stack React & Node Engineer',
    bio: 'Full Stack Engineer specializing in React, Next.js, Node.js and Postgres. 5+ years of experience building modern web apps with robust architectures.',
    location: 'Tunis, Tunisia',
    hourly_rate: 45
  },
  {
    id: '100ddca0-3d06-430b-9c9a-98458b4964ea',
    name: 'Aziz Kouki',
    email: 'koukiaziz.x1@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=80',
    title: 'Expert UI/UX & Interactive Product Designer',
    bio: 'Senior UI/UX & Brand Designer. I craft premium, high-converting digital interfaces in Figma, Tailwind, and Webflow. Focused on user psychology.',
    location: 'Sousse, Tunisia',
    hourly_rate: 35
  },
  {
    id: 'f6f1a61d-b988-4338-a83a-c8e3e043c6fb',
    name: 'Hajer Ben Rbeh',
    email: 'hajerbenrbeh.eng@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=80',
    title: 'Bilingual Copywriter & SEO Specialist',
    bio: 'Bilingual Copywriter & Content Strategist (Arabic/French/English). Passionate about SEO blog posts, tech copywriting, and social media brand growth.',
    location: 'Sfax, Tunisia',
    hourly_rate: 20
  },
  {
    id: '4f1838f3-f075-4fc8-882e-1cb9d724f001',
    name: 'Yasser Gombra',
    email: 'yasserg4e@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=80',
    title: 'Python Developer & Automation Expert',
    bio: 'Python Developer & Data Analyst. Specialist in Web Scraping, automation scripts, Pandas processing, and machine learning pipelines.',
    location: 'Ariana, Tunisia',
    hourly_rate: 30
  }
];

async function deleteTableData(tableName) {
  console.log(`Clearing ${tableName}...`);
  let query = supabase.from(tableName).delete();
  if (tableName === 'proposal_withdrawal_log') {
    query = query.neq('proposal_id', '00000000-0000-0000-0000-000000000000');
  } else {
    query = query.neq('id', '00000000-0000-0000-0000-000000000000');
  }
  const { error } = await query;
  if (error) {
    console.warn(`⚠️ Warning clearing ${tableName}:`, error.message);
  }
}

async function reseed() {
  console.log('🚀 Starting Database Reseed...');

  // 1. Delete transactional data in correct order (dependency hierarchy)
  await deleteTableData('messages');
  await deleteTableData('conversations');
  await deleteTableData('contract_delivery_assets');
  await deleteTableData('contract_deliveries');
  await deleteTableData('contract_change_requests');
  await deleteTableData('milestones');
  await deleteTableData('contracts');
  await deleteTableData('proposal_withdrawal_log');
  await deleteTableData('proposals');
  await deleteTableData('favorites');
  await deleteTableData('jobs');
  await deleteTableData('reviews');
  await deleteTableData('notifications');
  await deleteTableData('disputes');
  await deleteTableData('support_tickets');
  await deleteTableData('transactions');
  await deleteTableData('withdrawals');
  await deleteTableData('connects_transactions');
  await deleteTableData('payment_audit_log');
  await deleteTableData('identity_verifications');
  await deleteTableData('email_dispatch_log');
  await deleteTableData('reports');
  await deleteTableData('security_audit_logs');
  await deleteTableData('upload_audit_log');
  await deleteTableData('admin_audit_logs');
  await deleteTableData('account_deletion_requests');
  await deleteTableData('portfolio_items');
  await deleteTableData('payment_methods');

  console.log('✅ Stale transactional data cleared!');

  // 2. Prepare & update profiles of mock freelancers
  console.log('🔄 Seeding profile data for mock freelancers...');
  for (const f of FREELANCERS) {
    // Upsert profiles
    const { error: pError } = await supabase
      .from('profiles')
      .upsert({
        id: f.id,
        full_name: f.name,
        email: f.email,
        avatar_url: f.avatar,
        location: f.location,
        bio: f.bio,
        user_type: 'freelancer',
        cin_verified: true,
        phone_verified: true,
        payment_verified: true,
        onboarding_completed: true,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

    if (pError) console.error(`  ❌ Failed profile upsert for ${f.name}:`, pError.message);

    // Upsert freelancer_profiles
    const { error: fpError } = await supabase
      .from('freelancer_profiles')
      .upsert({
        id: f.id,
        skills: f.title.toLowerCase().includes('designer') 
          ? ['Figma', 'UI/UX Design', 'Tailwind', 'Mobile Design', 'Branding']
          : f.title.toLowerCase().includes('copywriter')
          ? ['Content Writing', 'Arabic', 'French', 'SEO', 'Translation']
          : f.title.toLowerCase().includes('python')
          ? ['Python', 'Pandas', 'Data Analysis', 'Automation', 'FastAPI']
          : ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Next.js'],
        availability: 'available',
        weekly_availability_hours: 40,
        years_experience: 5,
        connects_balance: 100,
        tools: f.title.toLowerCase().includes('designer') ? ['Figma', 'Photoshop', 'Illustrator'] : ['VSCode', 'Git', 'Docker'],
        project_preferences: { hourly: true, fixed: true }
      }, { onConflict: 'id' });

    if (fpError) console.error(`  ❌ Failed freelancer_profile upsert for ${f.name}:`, fpError.message);

    // Bootstrap wallet for freelancer
    const { error: wError } = await supabase
      .from('wallets')
      .upsert({
        user_id: f.id,
        balance: 500
      }, { onConflict: 'user_id' });

    if (wError) console.error(`  ❌ Failed wallet upsert for ${f.name}:`, wError.message);
  }

  // 3. Make sure client Wassim has a fully funded wallet
  console.log('🔄 Funding client wallet...');
  const { error: cwError } = await supabase
    .from('wallets')
    .upsert({
      user_id: CLIENT_ID,
      balance: 2500
    }, { onConflict: 'user_id' });
  if (cwError) console.error('  ❌ Failed to fund client wallet:', cwError.message);

  // Make sure client profiles contains correct type
  const { error: cpError } = await supabase
    .from('profiles')
    .update({
      full_name: 'wassim abdelli',
      avatar_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=500&auto=format&fit=crop&q=80',
      user_type: 'client',
      active_mode: 'client',
      cin_verified: true,
      phone_verified: true
    })
    .eq('id', CLIENT_ID);
  if (cpError) console.error('  ❌ Failed to update client profile:', cpError.message);

  // 4. Create Clean Jobs
  console.log('🔄 Creating clean active jobs...');
  const jobsData = [
    {
      client_id: CLIENT_ID,
      title: 'Modern Figma UI/UX Design for SaaS Startup',
      description: 'We are looking for a talented designer to create wireframes, mockups, and interactive prototypes for our new SaaS billing platform. The project has 12 screens in total. Figma source files are required. Upwork-like quality is expected.',
      category: 'design',
      job_type: 'fixed_price',
      budget_min: 300,
      budget_max: 600,
      experience_level: 'intermediate',
      required_skills: ['Figma', 'UI/UX Design', 'SaaS', 'Prototyping'],
      visibility: 'public',
      status: 'open',
      attachments: ['https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=800&auto=format&fit=crop&q=80']
    },
    {
      client_id: CLIENT_ID,
      title: 'Full-Stack React + Node.js E-Commerce Platform',
      description: 'We need an expert full-stack developer to build a clean web application using React, TypeScript, and Node.js. The app requires Google Auth, a product catalog, Stripe/D1 payment integration, and a customer admin dashboard. Source code must be clean and modular.',
      category: 'development',
      job_type: 'fixed_price',
      budget_min: 800,
      budget_max: 1500,
      experience_level: 'expert',
      required_skills: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'E-commerce'],
      visibility: 'public',
      status: 'open',
      attachments: ['https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80']
    },
    {
      client_id: CLIENT_ID,
      title: 'Bilingual Copywriter for Tech Blog (Arabic/French)',
      description: 'Looking for an expert copywriter to write SEO-optimized blog posts and product guides in Arabic and French. Experience in tech writing is highly preferred. This is a long-term collaboration with weekly articles.',
      category: 'writing',
      job_type: 'hourly',
      budget_min: null,
      budget_max: null,
      experience_level: 'intermediate',
      required_skills: ['Content Writing', 'Arabic', 'French', 'SEO', 'Translation'],
      visibility: 'public',
      status: 'open',
      attachments: ['https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&auto=format&fit=crop&q=80']
    },
    {
      client_id: CLIENT_ID,
      title: 'Mobile App Design for Delivery Startup (Tunisia)',
      description: 'We are looking for a creative UI/UX designer to design a mobile delivery application (iOS & Android). Needs to include screens for customer ordering, courier tracking, and restaurant dashboard. Tunisian market context.',
      category: 'design',
      job_type: 'fixed_price',
      budget_min: 500,
      budget_max: 900,
      experience_level: 'intermediate',
      required_skills: ['Figma', 'UI/UX Design', 'Mobile Design', 'iOS', 'Android'],
      visibility: 'public',
      status: 'open',
      attachments: ['https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&auto=format&fit=crop&q=80']
    },
    {
      client_id: CLIENT_ID,
      title: 'Python Scripts for Real Estate Web Scraping',
      description: 'Need a freelancer to write Python scripts to extract real estate listings from local directories. Output should be formatted as clean Excel/CSV files. Speed, proxy rotation, and anti-blocking are key.',
      category: 'development',
      job_type: 'fixed_price',
      budget_min: 200,
      budget_max: 400,
      experience_level: 'intermediate',
      required_skills: ['Python', 'BeautifulSoup', 'Scrapy', 'Web Scraping', 'Data Extraction'],
      visibility: 'public',
      status: 'open',
      attachments: ['https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80']
    },
    {
      client_id: CLIENT_ID,
      title: 'Brand Logo & Visual Identity Guidelines',
      description: 'We need a complete visual identity redesign. This includes a modern vector logo, color palette, typography guidelines, and brand asset templates for social media.',
      category: 'design',
      job_type: 'fixed_price',
      budget_min: 400,
      budget_max: 800,
      experience_level: 'expert',
      required_skills: ['Branding', 'Logo Design', 'Illustrator', 'Visual Identity'],
      visibility: 'public',
      status: 'open',
      attachments: ['https://images.unsplash.com/photo-1561070791-26c113006238?w=800&auto=format&fit=crop&q=80']
    }
  ];

  const { data: createdJobs, error: cjError } = await supabase
    .from('jobs')
    .insert(jobsData)
    .select('id, title');

  if (cjError) {
    console.error('❌ Failed to insert active jobs:', cjError.message);
    return;
  }
  console.log(`✅ Seeded ${createdJobs.length} active jobs!`);

  // Map created jobs to proposals
  const uiuxJobId = createdJobs.find(j => j.title.includes('SaaS Startup'))?.id;
  const devJobId = createdJobs.find(j => j.title.includes('E-Commerce'))?.id;
  const writingJobId = createdJobs.find(j => j.title.includes('Copywriter'))?.id;
  const deliveryJobId = createdJobs.find(j => j.title.includes('Delivery Startup'))?.id;
  const scrapingJobId = createdJobs.find(j => j.title.includes('Web Scraping'))?.id;
  const brandingJobId = createdJobs.find(j => j.title.includes('Visual Identity'))?.id;

  const proposalsData = [];

  // Job 1 (UI/UX) proposals
  if (uiuxJobId) {
    proposalsData.push(
      {
        job_id: uiuxJobId,
        freelancer_id: '100ddca0-3d06-430b-9c9a-98458b4964ea', // Aziz Kouki
        cover_letter: 'Hello Wassim! I have read your project description for the SaaS UI/UX design. I have 6+ years of experience designing dashboards and SaaS portals. You can check my profile for reviews on my Figma work. I propose 350 TND for a delivery in 7 days.',
        bid_amount: 350,
        delivery_time_days: 7,
        status: 'pending'
      },
      {
        job_id: uiuxJobId,
        freelancer_id: 'e229310c-48a5-4529-8d87-aa148fb0b524', // Zouhour Abdelli
        cover_letter: "Hi Wassim, I'm a developer but I also design UI/UX in Figma before coding. I can help design your screens with a developers perspective (which ensures everything is clean and buildable!). I propose 500 TND, delivery in 10 days.",
        bid_amount: 500,
        delivery_time_days: 10,
        status: 'pending'
      }
    );
  }

  // Job 2 (React/Node) proposals
  if (devJobId) {
    proposalsData.push(
      {
        job_id: devJobId,
        freelancer_id: 'e229310c-48a5-4529-8d87-aa148fb0b524', // Zouhour Abdelli
        cover_letter: 'Hi Wassim! I am a senior Full-Stack React & Node developer. I have built several e-commerce sites using Stripe, NextJS, and Postgres. I can build your project in 14 days with fully typed code and clean tests. I bid 1200 TND.',
        bid_amount: 1200,
        delivery_time_days: 14,
        status: 'pending'
      },
      {
        job_id: devJobId,
        freelancer_id: '4f1838f3-f075-4fc8-882e-1cb9d724f001', // Yasser Gombra
        cover_letter: 'Hello! I am a Python and backend specialist. I can build your e-commerce backend in Python/FastAPI, or Node.js. I propose a clean API and a modern React frontend. Budget: 1000 TND, delivery in 12 days.',
        bid_amount: 1000,
        delivery_time_days: 12,
        status: 'pending'
      }
    );
  }

  // Job 3 (Writing) proposals
  if (writingJobId) {
    proposalsData.push(
      {
        job_id: writingJobId,
        freelancer_id: 'f6f1a61d-b988-4338-a83a-c8e3e043c6fb', // Hajer Ben Rbeh
        cover_letter: 'Hi Wassim, I am a native Arabic speaker and fluent in French (lived and studied in Tunis/France). I have written over 200 blog posts for IT and tech startups. I am familiar with SEO keywords research and WordPress. Proposing 25 TND per hour.',
        bid_amount: 25,
        delivery_time_days: 5,
        status: 'pending'
      }
    );
  }

  // Job 4 (Delivery Mobile App) proposals
  if (deliveryJobId) {
    proposalsData.push(
      {
        job_id: deliveryJobId,
        freelancer_id: '100ddca0-3d06-430b-9c9a-98458b4964ea', // Aziz Kouki
        cover_letter: "Hi Wassim! I'd love to design your delivery mobile app. I have designed 4 local Tunisian e-commerce and delivery apps. I can share the Figma links with you. Budget: 600 TND, 8 days.",
        bid_amount: 600,
        delivery_time_days: 8,
        status: 'pending'
      }
    );
  }

  // Job 5 (Python Scraping) proposals
  if (scrapingJobId) {
    proposalsData.push(
      {
        job_id: scrapingJobId,
        freelancer_id: '4f1838f3-f075-4fc8-882e-1cb9d724f001', // Yasser Gombra
        cover_letter: "Hello Wassim! I have extensive scraping experience (Tayara, Tunisie Annonces, etc.). I can deliver clean Python scripts with CSV/Excel output. Budget: 250 TND, 4 days.",
        bid_amount: 250,
        delivery_time_days: 4,
        status: 'pending'
      }
    );
  }

  // Job 6 (Logo Branding) proposals
  if (brandingJobId) {
    proposalsData.push(
      {
        job_id: brandingJobId,
        freelancer_id: '100ddca0-3d06-430b-9c9a-98458b4964ea', // Aziz Kouki
        cover_letter: "Hi Wassim, branding is my main passion. I will provide 3 initial logo concepts, color guidelines, and social media kits. Budget: 500 TND, 5 days.",
        bid_amount: 500,
        delivery_time_days: 5,
        status: 'pending'
      }
    );
  }

  console.log('🔄 Seeding clean proposals...');
  const { data: createdProposals, error: cpErrorInsert } = await supabase
    .from('proposals')
    .insert(proposalsData)
    .select('id');

  if (cpErrorInsert) {
    console.error('❌ Failed to insert proposals:', cpErrorInsert.message);
    return;
  }

  console.log(`✅ Seeded ${createdProposals.length} active proposals!`);
  console.log(`\n✨ Database reseed completed successfully! Pruned all clutter, created ${createdJobs.length} fresh jobs with images, and ${createdProposals.length} realistic proposals.`);
}

reseed().catch(err => console.error('Fatal error during seed:', err));
