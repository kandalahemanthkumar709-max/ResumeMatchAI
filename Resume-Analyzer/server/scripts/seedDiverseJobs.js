import mongoose from 'mongoose';
import User from '../models/User.js';
import Job from '../models/Job.js';
import MatchCache from '../models/MatchCache.js';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Seeds diverse jobs across different domains so the matching engine
 * has real material to work with for any type of resume.
 * 
 * Domains covered:
 * - AI / ML / Agentic AI
 * - Java / Spring Boot
 * - MERN / Full Stack
 * - Frontend (React)
 * - Data Science / Python
 * - DevOps / Cloud
 */

const diverseJobs = [
    // ─── AI / ML Domain ──────────────────────────────────────────────
    {
        title: 'AI / ML Engineer',
        company: 'OpenAI Partners',
        location: 'San Francisco, CA',
        locationType: 'remote',
        jobType: 'full-time',
        description: 'Build and deploy large language model pipelines, agentic AI workflows, and RAG systems.',
        requirements: 'Python, LangChain, OpenAI API, Vector Databases. 2+ years experience.',
        status: 'active',
        structuredData: {
            required_skills: ['Python', 'LangChain', 'OpenAI', 'Machine Learning', 'AI', 'NLP'],
            nice_to_have_skills: ['LlamaIndex', 'Pinecone', 'FastAPI', 'Docker'],
            min_experience_years: 2,
            education_required: 'Bachelor',
            seniority_level: 'mid',
            key_technologies: ['Python', 'LangChain', 'TensorFlow', 'PyTorch']
        }
    },
    {
        title: 'Agentic AI Developer',
        company: 'DeepMind Solutions',
        location: 'Remote',
        locationType: 'remote',
        jobType: 'full-time',
        description: 'Design autonomous AI agents using multi-agent frameworks. Work on cutting-edge agentic systems.',
        requirements: 'Python, LangChain/LangGraph, CrewAI or AutoGen, LLMs. Strong AI foundations.',
        status: 'active',
        structuredData: {
            required_skills: ['Python', 'AI', 'LangChain', 'LLM', 'Agentic AI', 'Prompt Engineering'],
            nice_to_have_skills: ['CrewAI', 'AutoGen', 'LangGraph', 'Retrieval Augmented Generation'],
            min_experience_years: 1,
            education_required: 'Bachelor',
            seniority_level: 'mid',
            key_technologies: ['Python', 'OpenAI', 'LangChain', 'Vector DB']
        }
    },
    {
        title: 'Machine Learning Engineer',
        company: 'DataFlow AI',
        location: 'Bangalore, India',
        locationType: 'hybrid',
        jobType: 'full-time',
        description: 'Build ML pipelines, train models, and deploy to production using MLOps best practices.',
        requirements: 'Python, TensorFlow or PyTorch, Scikit-learn, SQL, model deployment experience.',
        status: 'active',
        structuredData: {
            required_skills: ['Python', 'Machine Learning', 'TensorFlow', 'Scikit-learn', 'SQL'],
            nice_to_have_skills: ['PyTorch', 'MLflow', 'Kubernetes', 'AWS SageMaker'],
            min_experience_years: 2,
            education_required: 'Bachelor',
            seniority_level: 'mid',
            key_technologies: ['Python', 'TensorFlow', 'PyTorch', 'SQL']
        }
    },

    // ─── Java / Spring Boot Domain ────────────────────────────────────
    {
        title: 'Java Backend Developer',
        company: 'Infosys Enterprise',
        location: 'Hyderabad, India',
        locationType: 'onsite',
        jobType: 'full-time',
        description: 'Build scalable enterprise-grade REST APIs using Java and Spring Boot.',
        requirements: 'Java, Spring Boot, Hibernate, REST APIs, SQL. 2+ years.',
        status: 'active',
        structuredData: {
            required_skills: ['Java', 'Spring Boot', 'REST APIs', 'SQL', 'Hibernate'],
            nice_to_have_skills: ['Microservices', 'Docker', 'Kafka', 'Redis'],
            min_experience_years: 2,
            education_required: 'Bachelor',
            seniority_level: 'mid',
            key_technologies: ['Java', 'Spring Boot', 'Maven', 'PostgreSQL']
        }
    },
    {
        title: 'Senior Java Engineer',
        company: 'TCS Digital',
        location: 'Chennai, India',
        locationType: 'hybrid',
        jobType: 'full-time',
        description: 'Lead Java development for high-throughput financial systems using microservices.',
        requirements: 'Java, Spring Boot, Microservices, Docker, Kubernetes, 5+ years.',
        status: 'active',
        structuredData: {
            required_skills: ['Java', 'Spring Boot', 'Microservices', 'Docker', 'Kubernetes'],
            nice_to_have_skills: ['AWS', 'Kafka', 'Redis', 'CI/CD'],
            min_experience_years: 5,
            education_required: 'Bachelor',
            seniority_level: 'senior',
            key_technologies: ['Java', 'Spring', 'Docker', 'Kubernetes']
        }
    },

    // ─── MERN / Full Stack Domain ─────────────────────────────────────
    {
        title: 'MERN Stack Developer',
        company: 'StartupHub',
        location: 'Remote',
        locationType: 'remote',
        jobType: 'full-time',
        description: 'Build full-stack web applications using MongoDB, Express, React, and Node.js.',
        requirements: 'React, Node.js, Express, MongoDB, JavaScript, REST APIs.',
        status: 'active',
        structuredData: {
            required_skills: ['React', 'Node.js', 'Express', 'MongoDB', 'JavaScript'],
            nice_to_have_skills: ['TypeScript', 'Redux', 'JWT', 'Docker'],
            min_experience_years: 1,
            education_required: 'Bachelor',
            seniority_level: 'junior',
            key_technologies: ['React', 'Node.js', 'MongoDB', 'Express']
        }
    },
    {
        title: 'Full Stack Developer',
        company: 'WebCraft Agency',
        location: 'Pune, India',
        locationType: 'hybrid',
        jobType: 'full-time',
        description: 'End-to-end development of web applications. Own features from design to deployment.',
        requirements: 'JavaScript, React or Vue, Node.js, SQL or NoSQL databases.',
        status: 'active',
        structuredData: {
            required_skills: ['JavaScript', 'React', 'Node.js', 'HTML5', 'CSS3'],
            nice_to_have_skills: ['TypeScript', 'PostgreSQL', 'MongoDB', 'AWS'],
            min_experience_years: 2,
            education_required: 'Bachelor',
            seniority_level: 'mid',
            key_technologies: ['React', 'Node.js', 'JavaScript', 'CSS']
        }
    },

    // ─── Data Science / Python Domain ─────────────────────────────────
    {
        title: 'Data Scientist',
        company: 'Analytics Corp',
        location: 'Bangalore, India',
        locationType: 'hybrid',
        jobType: 'full-time',
        description: 'Analyze large datasets, build predictive models, and communicate insights to stakeholders.',
        requirements: 'Python, Pandas, NumPy, Matplotlib, Scikit-learn, SQL.',
        status: 'active',
        structuredData: {
            required_skills: ['Python', 'Pandas', 'NumPy', 'Scikit-learn', 'SQL', 'Data Analysis'],
            nice_to_have_skills: ['Tableau', 'Power BI', 'Spark', 'Machine Learning'],
            min_experience_years: 1,
            education_required: 'Bachelor',
            seniority_level: 'junior',
            key_technologies: ['Python', 'Pandas', 'SQL', 'Scikit-learn']
        }
    },
    {
        title: 'Python Developer',
        company: 'PyTech Solutions',
        location: 'Remote',
        locationType: 'remote',
        jobType: 'full-time',
        description: 'Build automation scripts, data pipelines, and backend APIs using Python.',
        requirements: 'Python, FastAPI or Flask or Django, SQL, REST APIs.',
        status: 'active',
        structuredData: {
            required_skills: ['Python', 'REST APIs', 'SQL', 'Flask'],
            nice_to_have_skills: ['FastAPI', 'Django', 'Docker', 'AWS Lambda'],
            min_experience_years: 1,
            education_required: 'Bachelor',
            seniority_level: 'junior',
            key_technologies: ['Python', 'Flask', 'PostgreSQL', 'Git']
        }
    },

    // ─── DevOps / Cloud Domain ────────────────────────────────────────
    {
        title: 'DevOps Engineer',
        company: 'CloudOps Inc',
        location: 'Remote',
        locationType: 'remote',
        jobType: 'full-time',
        description: 'Build CI/CD pipelines, manage cloud infrastructure, and containerize applications.',
        requirements: 'Docker, Kubernetes, AWS or GCP, Jenkins or GitHub Actions, Linux.',
        status: 'active',
        structuredData: {
            required_skills: ['Docker', 'Kubernetes', 'AWS', 'CI/CD', 'Linux'],
            nice_to_have_skills: ['Terraform', 'Ansible', 'Prometheus', 'Grafana'],
            min_experience_years: 2,
            education_required: 'Bachelor',
            seniority_level: 'mid',
            key_technologies: ['Docker', 'Kubernetes', 'AWS', 'Jenkins']
        }
    },

    // ─── Frontend Domain ──────────────────────────────────────────────
    {
        title: 'Frontend Developer',
        company: 'PixelForge',
        location: 'Remote',
        locationType: 'remote',
        jobType: 'full-time',
        description: 'Build stunning, accessible, pixel-perfect UIs with React and modern CSS.',
        requirements: 'React, JavaScript, HTML5, CSS3, Tailwind CSS or CSS-in-JS.',
        status: 'active',
        structuredData: {
            required_skills: ['React', 'JavaScript', 'HTML5', 'CSS3'],
            nice_to_have_skills: ['TypeScript', 'Tailwind CSS', 'Figma', 'Accessibility'],
            min_experience_years: 1,
            education_required: 'Bachelor',
            seniority_level: 'junior',
            key_technologies: ['React', 'JavaScript', 'HTML', 'CSS']
        }
    },
];

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Use Sarah (recruiter) as job poster
        const recruiter = await User.findOne({ role: 'recruiter' });
        if (!recruiter) {
            console.error('❌ No recruiter found. Run the main seed first.');
            process.exit(1);
        }

        // Remove old single-domain jobs (all the Netflix React jobs)
        const deleted = await Job.deleteMany({ company: 'Netflix' });
        console.log(`🗑️  Removed ${deleted.deletedCount} old Netflix-only jobs`);

        // Clear all match caches (they'll be recomputed with new jobs)
        const cacheDeleted = await MatchCache.deleteMany({});
        console.log(`🗑️  Cleared ${cacheDeleted.deletedCount} stale match cache entries`);

        // Insert diverse jobs
        const created = await Promise.all(
            diverseJobs.map(job => Job.create({ ...job, postedBy: recruiter._id }))
        );

        console.log(`\n✅ Seeded ${created.length} diverse jobs across domains:`);
        created.forEach(j => console.log(`   • ${j.title} @ ${j.company} [${j.locationType}]`));

        console.log('\n🚀 Job seeding complete! The matching engine will now work for ANY resume domain.');
        process.exit(0);
    } catch (err) {
        console.error('❌ Seeding failed:', err.message);
        process.exit(1);
    }
};

seed();
