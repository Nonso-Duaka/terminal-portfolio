// Resume content for Nonso Duaka
module.exports = {
  name: 'Nonso Duaka',
  tagline: 'Aspiring Computational Biology & ML Researcher',
  email: 'nonsoduaka821@gmail.com',
  phone: '(318)-232-2055',
  linkedin: 'linkedin.com/in/nonsoduaka',
  github: 'github.com/nonsoduaka',

  education: {
    school: 'Grambling State University',
    degree: 'B.S. in Computer Science, Math & Physics',
    gpa: '4.0/4.0',
    expected: 'May 2027',
  },

  skills: {
    'Languages':        'Python, R, JavaScript, C++, Bash',
    'Systems & Tools':  'Linux, Docker, HPC, CUDA, Git',
    'ML Frameworks':    'PyTorch, HuggingFace, Scikit-learn',
    'Libraries':        'pandas, NumPy, Matplotlib, SciPy',
    'CompBio & Chem':   'PyRosetta, RDKit, PyMOL',
  },

  experience: [
    {
      role: 'SPAR Research Mentee',
      org: 'SecureBio',
      date: 'Feb 2026 - Present',
      location: 'Remote',
      bullets: [
        'Curating vertebrate-infecting viral and non-viral training datasets for sequence-based classification',
        'Fine-tuning DNABERT2 with LoRA for parameter-efficient viral sequence classification',
        'Evaluating fine-tuned model on metagenomic nasal swab reads for novel viral detection',
      ],
    },
    {
      role: 'AI Engineering Intern',
      org: 'ArcellAI',
      date: 'Jan 2026 - Present',
      location: 'Remote',
      bullets: [
        'Integrated scFoundation single cell model into Arcella\'s server stack for scalable training/inference',
        'Built multimodal data and benchmarking pipelines for perturbational biology & drug discovery',
        'Supported deployment of foundation models within an open source virtual cell environment',
      ],
    },
    {
      role: 'ML Research Intern',
      org: 'Merck & Co',
      date: 'Jun 2025 - Aug 2025',
      location: 'South San Francisco, CA',
      bullets: [
        'Benchmarked 8 protein language models in zero-shot setting for antibody thermostability prediction',
        'Developed Thermostabilizer: end-to-end pipeline integrating PLMs, GNNs, and Rosetta',
        'Collaborated with experimentalists to validate 36 antibody variants with nanoDSF',
      ],
    },
    {
      role: 'Research Assistant',
      org: 'Carnegie Mellon University (CMUPittCompBio)',
      date: 'Aug 2025 - Present',
      location: 'Remote',
      bullets: [
        'Integrated protein embedding model into SPRINT for drug-target interaction prediction',
        'Performed evaluation-driven ablations on Lit PCBA benchmark',
        'Evaluated SPRINT virtual screening on VSDS-VD benchmark dataset',
      ],
    },
    {
      role: 'Research Assistant',
      org: 'University of Pittsburgh',
      date: 'Aug 2024 - Present',
      location: 'Remote',
      bullets: [
        'Implemented PubChem API features in MolModA molecular docking suite',
        'Developed RDKit-based visualization tools for interpretable reaction maps',
        'Built Reactive Fragment Database for combinatorial library generation',
      ],
    },
  ],

  presentations: [
    'Nonso N. Duaka et al. "Evaluating Protein Language Models for Thermostability Prediction of Antibody Variants" RosettaCON, poster (2025)',
    'Nonso N. Duaka et al. "Evaluating Protein Language Models for Thermostability Prediction of Antibody Variants" Merck SSF Intern Symposium, poster (2025)',
  ],

  training: {
    org: 'Johns Hopkins University | Rosetta Commons REU',
    date: 'Jun 2025 - Aug 2025',
    location: 'Baltimore, MD',
    bullets: [
      'Selected for competitive Rosetta Commons REU, placed in Merck Discovery Biologics',
      'Completed coding bootcamp on PyRosetta, structural bioinformatics, and computational biology',
      'Presented at Rosetta Summer Conference in Seattle',
    ],
  },
};
