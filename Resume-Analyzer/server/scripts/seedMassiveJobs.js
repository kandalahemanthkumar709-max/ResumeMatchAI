import mongoose from 'mongoose';
import User from '../models/User.js';
import Job from '../models/Job.js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const seedJobs = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // 1. Restore 3 Recruiters with REAL emails
        // Gmail Plus Trick: +sarah and +john all deliver to your main inbox
        const recruiterData = [
            { name: 'Hemanth Recruiter', email: 'kandalahemanthkumar709@gmail.com', password: 'Hemanth@123', role: 'recruiter' },
            { name: 'Sarah HR',          email: 'kandalahemanthkumar709+sarah@gmail.com', password: 'Sarah@123', role: 'recruiter' },
            { name: 'John Talent',       email: 'kandalahemanthkumar709+john@gmail.com', password: 'John@123', role: 'recruiter' },
        ];

        const recruiters = [];
        for (const data of recruiterData) {
            // Always delete and re-create to ensure password is hashed correctly
            await User.deleteOne({ email: data.email });
            // DO NOT pre-hash here — the model's pre-save hook does it automatically!
            const user = await User.create(data);
            console.log(`👤 Created Recruiter: ${user.name} <${user.email}>`);
            recruiters.push(user);
        }

        // 2. Define 30 Jobs with INR Salaries
        const allJobs = [
            // RECRUITER 1: AI & DATA
            { title: 'Generative AI Engineer', company: 'FutureTech AI', location: 'Bangalore, India', locationType: 'remote', jobType: 'full-time', description: 'Build LLM-powered applications using RAG and LangChain.', requirements: 'Python, OpenAI, Vector DBs, LangChain.', salary: { min: 2500000, max: 4500000, currency: 'INR', isVisible: true }, structuredData: { required_skills: ['Python', 'OpenAI', 'LangChain', 'LLM'], min_experience_years: 3 } },
            { title: 'Machine Learning Specialist', company: 'Neural Systems', location: 'Hyderabad, India', locationType: 'hybrid', jobType: 'full-time', description: 'Train and optimize computer vision models.', requirements: 'PyTorch, TensorFlow, Computer Vision, C++.', salary: { min: 2000000, max: 3500000, currency: 'INR', isVisible: true }, structuredData: { required_skills: ['PyTorch', 'TensorFlow', 'Computer Vision'], min_experience_years: 4 } },
            { title: 'Data Scientist', company: 'BigData Corp', location: 'Pune, India', locationType: 'onsite', jobType: 'full-time', description: 'Analyze consumer behavior data to drive strategy.', requirements: 'SQL, Python, Pandas, Statistics.', salary: { min: 1200000, max: 2200000, currency: 'INR', isVisible: true }, structuredData: { required_skills: ['SQL', 'Python', 'Pandas', 'Statistics'], min_experience_years: 2 } },
            { title: 'NLP Researcher', company: 'WordStream AI', location: 'Remote', locationType: 'remote', jobType: 'contract', description: 'Conduct research on BERT and Transformer models.', requirements: 'PhD/Masters, Python, Researchers, NLP.', salary: { min: 3000000, max: 5500000, currency: 'INR', isVisible: true }, structuredData: { required_skills: ['NLP', 'Transformers', 'Python'], min_experience_years: 5 } },
            { title: 'AI Ethics Consultant', company: 'SafeAI', location: 'Remote', locationType: 'remote', jobType: 'full-time', description: 'Ensure AI models are unbiased and ethical.', requirements: 'AI Ethics, Policy, Sociology, Data Science.', salary: { min: 1500000, max: 2500000, currency: 'INR', isVisible: true }, structuredData: { required_skills: ['AI Ethics', 'Data Policy', 'Compliance'], min_experience_years: 3 } },
            { title: 'Data Engineer', company: 'StreamLine', location: 'Mumbai, India', locationType: 'hybrid', jobType: 'full-time', description: 'Build robust data pipelines with Kafka.', requirements: 'Scala, Spark, Kafka, AWS.', salary: { min: 1800000, max: 3000000, currency: 'INR', isVisible: true }, structuredData: { required_skills: ['Kafka', 'Spark', 'AWS', 'Scala'], min_experience_years: 3 } },
            { title: 'Prompt Engineer', company: 'CreativeBots', location: 'Remote', locationType: 'remote', jobType: 'full-time', description: 'Fine-tune prompts for creative writing AI.', requirements: 'Creative Coding, LLMs, Design.', salary: { min: 1000000, max: 1800000, currency: 'INR', isVisible: true }, structuredData: { required_skills: ['Prompt Engineering', 'LLM', 'GPT'], min_experience_years: 1 } },
            { title: 'Computer Vision Engineer', company: 'SightTech', location: 'Bangalore, India', locationType: 'onsite', jobType: 'full-time', description: 'Work on autonomous driving visual systems.', requirements: 'OpenCV, C++, Python, Deep Learning.', salary: { min: 2200000, max: 4000000, currency: 'INR', isVisible: true }, structuredData: { required_skills: ['OpenCV', 'C++', 'Deep Learning'], min_experience_years: 4 } },
            { title: 'Analytics Manager', company: 'Metric Dash', location: 'Delhi, India', locationType: 'hybrid', jobType: 'full-time', description: 'Manage a team of 10 data analysts.', requirements: 'Management, Tableau, SQL, Excel.', salary: { min: 2500000, max: 4500000, currency: 'INR', isVisible: true }, structuredData: { required_skills: ['Management', 'Tableau', 'SQL'], min_experience_years: 6 } },
            { title: 'Junior Data Analyst', company: 'GrowthX', location: 'Remote', locationType: 'remote', jobType: 'internship', description: 'Entry-level data role for recent graduates.', requirements: 'Excel, Basic SQL, Python.', salary: { min: 400000, max: 700000, currency: 'INR', isVisible: true }, structuredData: { required_skills: ['Excel', 'SQL', 'Python'], min_experience_years: 0 } },

            // RECRUITER 2: WEB DEV
            { title: 'Senior React Developer', company: 'WebFlow Pro', location: 'Remote', locationType: 'remote', jobType: 'full-time', description: 'Lead frontend architecture for SaaS platforms.', requirements: 'React, Redux, Tailwind, TypeScript.', salary: { min: 2400000, max: 4200000, currency: 'INR', isVisible: true }, structuredData: { required_skills: ['React', 'TypeScript', 'Tailwind', 'Redux'], min_experience_years: 5 } },
            { title: 'Backend Node.js Developer', company: 'FastApi Corp', location: 'Pune, India', locationType: 'hybrid', jobType: 'full-time', description: 'Scale microservices for millions of users.', requirements: 'Node.js, Express, MongoDB, Docker.', salary: { min: 1500000, max: 2800000, currency: 'INR', isVisible: true }, structuredData: { required_skills: ['Node.js', 'Express', 'MongoDB', 'Docker'], min_experience_years: 3 } },
            { title: 'Full Stack Engineer', company: 'MERN Masters', location: 'Ahmadabad, India', locationType: 'remote', jobType: 'full-time', description: 'Work on end-to-end features with the MERN stack.', requirements: 'MongoDB, Express, React, Node.', salary: { min: 1800000, max: 3200000, currency: 'INR', isVisible: true }, structuredData: { required_skills: ['React', 'Node.js', 'MongoDB', 'JavaScript'], min_experience_years: 2 } },
            { title: 'Java Developer', company: 'BankSecure', location: 'Hyderabad, India', locationType: 'onsite', jobType: 'full-time', description: 'Maintain critical banking backend systems.', requirements: 'Java, Spring Boot, Hibernate, Oracle.', salary: { min: 1200000, max: 2400000, currency: 'INR', isVisible: true }, structuredData: { required_skills: ['Java', 'Spring Boot', 'SQL'], min_experience_years: 4 } },
            { title: 'Python Backend Developer', company: 'DjangoHouse', location: 'Remote', locationType: 'remote', jobType: 'full-time', description: 'Develop web apps with Django and PostgreSQL.', requirements: 'Python, Django, Celery, Redis.', salary: { min: 1400000, max: 2600000, currency: 'INR', isVisible: true }, structuredData: { required_skills: ['Python', 'Django', 'PostgreSQL'], min_experience_years: 3 } },
            { title: 'Vue.js Developer', company: 'GreenUI', location: 'Remote', locationType: 'hybrid', jobType: 'full-time', description: 'Build reactive UIs with Vue 3 and Vite.', requirements: 'Vue.js, Pinia, CSS, JavaScript.', salary: { min: 800000, max: 1500000, currency: 'INR', isVisible: true }, structuredData: { required_skills: ['Vue.js', 'JavaScript', 'CSS'], min_experience_years: 2 } },
            { title: 'WordPress Developer', company: 'AgencyPrime', location: 'Remote', locationType: 'remote', jobType: 'freelance', description: 'Customize themes and plugins for clients.', requirements: 'PHP, WordPress, JavaScript, CSS.', salary: { min: 500000, max: 1000000, currency: 'INR', isVisible: true }, structuredData: { required_skills: ['PHP', 'WordPress', 'MySQL'], min_experience_years: 2 } },
            { title: 'Shopify Expert', company: 'EcomBoost', location: 'Remote', locationType: 'remote', jobType: 'contract', description: 'Help Shopify owners scale their stores.', requirements: 'Liquid, JavaScript, E-commerce.', salary: { min: 1000000, max: 1800000, currency: 'INR', isVisible: true }, structuredData: { required_skills: ['Liquid', 'Shopify', 'JavaScript'], min_experience_years: 3 } },
            { title: 'Angular Specialist', company: 'LogiSoft', location: 'Bangalore, India', locationType: 'onsite', jobType: 'full-time', description: 'Maintain enterprise-scale Angular portals.', requirements: 'Angular, RxJS, TypeScript, SCSS.', salary: { min: 1600000, max: 2800000, currency: 'INR', isVisible: true }, structuredData: { required_skills: ['Angular', 'TypeScript', 'RxJS'], min_experience_years: 4 } },
            { title: 'QA Engineer', company: 'TestPure', location: 'Remote', locationType: 'remote', jobType: 'full-time', description: 'Ensure quality via automation testing.', requirements: 'Selenium, Cypress, Jest, Testing.', salary: { min: 800000, max: 1400000, currency: 'INR', isVisible: true }, structuredData: { required_skills: ['Test Automation', 'Cypress', 'Selenium'], min_experience_years: 3 } },

            // RECRUITER 3: DEVOPS & MOBILE
            { title: 'Cloud Architect', company: 'SkyHigh Clouds', location: 'Bangalore, India', locationType: 'remote', jobType: 'full-time', description: 'Design complex multi-cloud solutions.', requirements: 'AWS, Azure, Terraform, Architecture.', salary: { min: 3500000, max: 6500000, currency: 'INR', isVisible: true }, structuredData: { required_skills: ['AWS', 'Azure', 'Terraform', 'Cloud Architecture'], min_experience_years: 8 } },
            { title: 'DevOps Specialist', company: 'DeployFast', location: 'Remote', locationType: 'remote', jobType: 'full-time', description: 'Automate deployments and manage K8s clusters.', requirements: 'Kubernetes, Docker, Jenkins, Linux.', salary: { min: 1800000, max: 3500000, currency: 'INR', isVisible: true }, structuredData: { required_skills: ['Kubernetes', 'Docker', 'Linux', 'Jenkins'], min_experience_years: 4 } },
            { title: 'iOS Developer', company: 'AppFactory', location: 'Pune, India', locationType: 'onsite', jobType: 'full-time', description: 'Build high-performance Swift applications.', requirements: 'Swift, SwiftUI, iOS SDK, CoreData.', salary: { min: 1500000, max: 3000000, currency: 'INR', isVisible: true }, structuredData: { required_skills: ['Swift', 'SwiftUI', 'iOS Development'], min_experience_years: 3 } },
            { title: 'Android Engineer', company: 'DroidGen', location: 'Bangalore, India', locationType: 'onsite', jobType: 'full-time', description: 'Develop Android apps with Kotlin and Jetpack Compose.', requirements: 'Kotlin, Jetpack Compose, Android SDK.', salary: { min: 1500000, max: 3000000, currency: 'INR', isVisible: true }, structuredData: { required_skills: ['Kotlin', 'Android SDK', 'Jetpack Compose'], min_experience_years: 3 } },
            { title: 'React Native Developer', company: 'CrossPlatform Labs', location: 'Remote', locationType: 'remote', jobType: 'full-time', description: 'Ship iOS and Android apps with one codebase.', requirements: 'React Native, JavaScript, Firebase.', salary: { min: 1400000, max: 2800000, currency: 'INR', isVisible: true }, structuredData: { required_skills: ['React Native', 'JavaScript', 'Mobile Development'], min_experience_years: 3 } },
            { title: 'Cyber Security Analyst', company: 'NetGuard', location: 'Delhi, India', locationType: 'onsite', jobType: 'full-time', description: 'Monitor and protect networks from threats.', requirements: 'Security+, Penetration Testing, Networking.', salary: { min: 1200000, max: 2200000, currency: 'INR', isVisible: true }, structuredData: { required_skills: ['CyberSecurity', 'Networking', 'Penetration Testing'], min_experience_years: 4 } },
            { title: 'Site Reliability Engineer', company: 'Uptime Systems', location: 'Remote', locationType: 'remote', jobType: 'full-time', description: 'Ensure system availability and zero-downtime.', requirements: 'Go/Python, Prometheus, Grafana, AWS.', salary: { min: 2000000, max: 4000000, currency: 'INR', isVisible: true }, structuredData: { required_skills: ['Prometheus', 'AWS', 'Python', 'Grafana'], min_experience_years: 5 } },
            { title: 'Flutter Developer', company: 'BlueWidget', location: 'Remote', locationType: 'remote', jobType: 'full-time', description: 'Craft beautiful mobile experiences with Flutter.', requirements: 'Dart, Flutter, Mobile, UI.', salary: { min: 1000000, max: 1800000, currency: 'INR', isVisible: true }, structuredData: { required_skills: ['Flutter', 'Dart', 'Mobile Development'], min_experience_years: 2 } },
            { title: 'System Administrator', company: 'InfraBase', location: 'Hyderabad, India', locationType: 'onsite', jobType: 'full-time', description: 'Maintain office servers and network infrastructure.', requirements: 'Linux, Windows Server, Networking.', salary: { min: 800000, max: 1400000, currency: 'INR', isVisible: true }, structuredData: { required_skills: ['Linux', 'Networking', 'Windows Server'], min_experience_years: 5 } },
            { title: 'Technical Support Specialist', company: 'HelpMe', location: 'Remote', locationType: 'remote', jobType: 'full-time', description: 'Assist customers with technical issues.', requirements: 'Troubleshooting, Customer Service, Tech Basics.', salary: { min: 400000, max: 700000, currency: 'INR', isVisible: true }, structuredData: { required_skills: ['Technical Support', 'Troubleshooting'], min_experience_years: 1 } }
        ];

        // 3. Seed jobs — one per recruiter in rotation (no deletion of existing jobs)
        let count = 0;
        for (let i = 0; i < allJobs.length; i++) {
            const recruiter = recruiters[i % 3];
            await Job.create({
                ...allJobs[i],
                postedBy: recruiter._id,
                status: 'active',
                expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
            });
            count++;
        }

        console.log(`\n✅ Seeded ${count} jobs across 3 recruiters!`);
        console.log('\n📧 Recruiter Login Details:');
        console.log('  Hemanth Recruiter  →  kandalahemanthkumar709@gmail.com  /  Hemanth@123');
        console.log('  Sarah HR           →  kandalahemanthkumar709+sarah@gmail.com  /  Sarah@123');
        console.log('  John Talent        →  kandalahemanthkumar709+john@gmail.com  /  John@123');
        console.log('\n💡 Gmail Plus Trick: +sarah and +john all deliver to your main inbox!');

    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

seedJobs();
