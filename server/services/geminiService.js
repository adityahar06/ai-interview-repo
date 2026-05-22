const { GoogleGenAI } = require('@google/genai');

// ✅ New @google/genai SDK — uses v1 API endpoint
const MODEL = 'gemini-2.0-flash';

const getAI = () => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Call Gemini with automatic retry on rate-limit (429)
 */
const callGemini = async (prompt, config = {}) => {
  const ai = getAI();
  const maxRetries = 3;
  const delays = [2000, 5000, 10000]; // 2s, 5s, 10s

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: MODEL,
        contents: prompt,
        config: {
          temperature: config.temperature ?? 0.8,
          topP: 0.95,
          maxOutputTokens: config.maxOutputTokens ?? 2048,
        },
      });
      return response.text.trim();
    } catch (err) {
      const isRateLimit = err.message?.includes('429') || err.message?.includes('quota');
      const isRetryable = isRateLimit && attempt < maxRetries;

      if (isRetryable) {
        console.warn(`⏳ Gemini rate limit hit — retrying in ${delays[attempt] / 1000}s... (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(res => setTimeout(res, delays[attempt]));
      } else {
        throw err;
      }
    }
  }
};

// ──────────────────────────────────────────────
// Topic pools — ensures each question covers a DIFFERENT concept
// ──────────────────────────────────────────────
const TOPIC_POOLS = {
  'Frontend Developer': [
    'HTML semantics and accessibility', 'CSS Flexbox vs Grid layout', 'JavaScript closures and scope',
    'React hooks useState and useEffect', 'State management Redux or Zustand', 'Browser rendering pipeline and performance',
    'TypeScript types interfaces and generics', 'REST API calls with Fetch and Axios', 'Testing with Jest and React Testing Library',
    'XSS and CSRF web security', 'Responsive design and media queries', 'Webpack and Vite build tools',
    'Code splitting and React lazy loading', 'Web Accessibility WCAG and ARIA roles', 'Event bubbling capturing and delegation',
  ],
  'Backend Developer': [
    'RESTful API design and best practices', 'JWT authentication and refresh tokens', 'Database normalization and schema design',
    'SQL vs NoSQL and when to use each', 'Node.js event loop and async patterns', 'Redis caching strategies',
    'Microservices vs monolith architecture', 'Message queues Kafka or RabbitMQ', 'Structured error handling and logging',
    'API rate limiting algorithms', 'Docker containerization basics', 'CI/CD pipeline design',
    'Database transactions and ACID properties', 'Query optimization and indexing', 'API versioning strategies',
  ],
  'Full Stack Developer': [
    'Client-server request lifecycle', 'RESTful API design principles', 'MongoDB schema and data modeling',
    'React component patterns and composition', 'JWT and OAuth2 auth flow', 'Docker and deployment basics',
    'WebSockets and real-time communication', 'Redux vs Context API state management', 'Code review best practices',
    'When to use microservices vs monolith', 'CDN and static asset caching', 'Managing environment variables securely',
    'E2E vs unit vs integration testing', 'Frontend performance optimization', 'Database scaling strategies',
  ],
  'Data Scientist': [
    'Supervised vs unsupervised learning', 'Overfitting regularization dropout', 'Feature engineering and selection',
    'Precision recall F1 score ROC AUC', 'Pandas and NumPy data manipulation', 'Handling missing and imbalanced data',
    'Hypothesis testing p-values', 'SQL window functions for analysis', 'Neural network backpropagation',
    'K-fold cross-validation', 'PCA and t-SNE dimensionality reduction', 'Designing an A/B test',
    'Bias-variance tradeoff', 'ARIMA and time series forecasting', 'Data visualization storytelling',
  ],
  'Machine Learning Engineer': [
    'End-to-end ML pipeline design', 'Canary and shadow model deployments', 'Feature stores and Feast',
    'Model drift and monitoring strategies', 'Distributed GPU training with PyTorch', 'Bayesian hyperparameter tuning Optuna',
    'Transfer learning and fine-tuning LLMs', 'MLflow experiment tracking', 'Horovod distributed training',
    'FAISS vector search and RAG', 'INT8 quantization and model pruning', 'Responsible AI and bias auditing',
    'DVC data versioning', 'gRPC model serving and TorchServe', 'CI/CD for ML with GitHub Actions',
  ],
  'DevOps Engineer': [
    'GitHub Actions CI/CD pipeline design', 'Kubernetes pods services and ingress', 'Terraform infrastructure as code',
    'AWS VPC EC2 RDS and S3 architecture', 'Prometheus metrics and Grafana dashboards', 'ELK stack centralized logging',
    'Blue-green and canary deployment strategies', 'Istio service mesh and traffic management', 'Vault secrets management',
    'Network security groups and zero-trust', 'Horizontal Pod Autoscaler in Kubernetes', 'DR strategy RTO and RPO',
    'Ansible playbook configuration management', 'SLO SLA SLI error budget SRE principles', 'FinOps cloud cost optimization',
  ],
  'Mobile Developer': [
    'React Native bridge and new architecture', 'Native module integration iOS Android', 'JS thread and UI thread optimization',
    'Offline-first with WatermelonDB or AsyncStorage', 'FCM and APNs push notification setup', 'Deep links and universal links',
    'Redux Toolkit mobile state management', 'React Navigation stack tab drawer', 'Detox E2E mobile testing',
    'TestFlight and Play Store deployment', 'Reducing APK size and startup time', 'iOS HIG vs Material Design differences',
    'Background fetch and workmanager', 'SSL pinning and secure storage', 'Reanimated 2 gesture handler animations',
  ],
  'System Design': [
    'Round-robin vs least-connections load balancing', 'Horizontal sharding and consistent hashing',
    'CAP theorem and eventual consistency', 'CDN edge caching and cache invalidation',
    'Kafka event-driven microservices', 'API gateway rate limiting and auth',
    'Token bucket vs leaky bucket algorithms', 'Distributed cache with Redis Cluster',
    'Saga pattern for distributed transactions', 'Service discovery Consul vs Kubernetes DNS',
    'Read replicas and CQRS pattern', 'Elasticsearch indexing and ranking',
    'WebSocket vs SSE for real-time', 'Multi-region active-active database', 'Design a URL shortener system',
  ],
  'Product Manager': [
    'RICE vs MoSCoW prioritization frameworks', 'Setting and measuring OKRs', 'Writing user stories with acceptance criteria',
    'Analyzing A/B test statistical significance', 'Managing stakeholders with conflicting priorities',
    'Building a go-to-market strategy', 'Running agile sprints and retrospectives',
    'Competitive analysis and positioning', 'Data-driven feature prioritization',
    'Qualitative user research methods', 'North star metric and product analytics',
    'Communicating roadmap changes to leadership', 'Technical debt negotiation with engineering',
    'Defining MVP scope and success metrics', 'Post-launch iteration and learnings',
  ],
  'General Software Engineer': [
    'Big-O complexity and space-time tradeoffs', 'Hash maps collision resolution open addressing chaining',
    'BFS DFS tree and graph problems', 'Dynamic programming memoization vs tabulation',
    'Recursion backtracking and pruning', 'Merge sort vs quicksort with pivot strategies',
    'SOLID principles with real examples', 'Factory Observer and Strategy design patterns',
    'Race conditions mutex and semaphores', 'JVM or V8 garbage collection strategies',
    'Database query execution plans and indexes', 'Horizontal vs vertical scaling',
    'Clean code naming functions and comments', 'Systematic debugging and root cause analysis',
    'REST vs GraphQL vs gRPC comparison',
  ],
};

/**
 * Generate UNIQUE interview questions, one per topic
 */
const generateInterviewQuestions = async (role, difficulty, count) => {
  const pool = TOPIC_POOLS[role] || TOPIC_POOLS['General Software Engineer'];
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const selectedTopics = shuffled.slice(0, Math.min(count, shuffled.length));
  const topicList = selectedTopics.map((t, i) => `${i + 1}. ${t}`).join('\n');

  const prompt = `You are a senior interviewer at a top tech company. Conduct a ${difficulty}-level ${role} interview.

Generate exactly ${count} questions — one specific question for each topic below. Each question MUST be different.

Topics:
${topicList}

Rules:
- ${difficulty === 'Easy' ? 'Test basic definitions and foundational understanding' : difficulty === 'Medium' ? 'Require practical experience and applied knowledge' : 'Require deep expertise, edge cases, and system thinking'}
- Each question must be specific and concrete — not vague
- Do NOT repeat or paraphrase similar questions
- Sound like real FAANG interview questions

Return ONLY a valid JSON array of exactly ${count} strings. Nothing else.
["Question 1?", "Question 2?", ...]`;

  try {
    const text = await callGemini(prompt, { temperature: 0.9 });
    const jsonMatch = text.match(/\[[\s\S]*?\]/);
    if (!jsonMatch) throw new Error('No JSON array in response');

    let questions = JSON.parse(jsonMatch[0]);
    questions = questions
      .map(q => (typeof q === 'string' ? q.trim() : ''))
      .filter((q, i, arr) => q.length > 15 && arr.indexOf(q) === i);

    if (questions.length < count) {
      const extras = getFallbackQuestions(role);
      questions = [...questions, ...extras].slice(0, count);
    }

    console.log(`✅ Generated ${questions.length} unique questions for [${role}] (${difficulty})`);
    return questions.slice(0, count);
  } catch (err) {
    console.error('Gemini generateQuestions error:', err.message);
    console.log('⚠️  Using smart fallback questions');
    return getFallbackQuestions(role).slice(0, count);
  }
};

/**
 * Comprehensive fallback questions — unique per role, randomly shuffled
 */
const getFallbackQuestions = (role) => {
  const banks = {
    'Frontend Developer': [
      'What is the difference between `null`, `undefined`, and undeclared in JavaScript?',
      'Explain how CSS specificity is calculated and give an example where it causes unexpected behavior.',
      "How does React's reconciliation algorithm (diffing) decide what to re-render?",
      'What is the difference between `useCallback` and `useMemo` and when should you use each?',
      'How would you implement a debounce function from scratch in JavaScript?',
      'Explain the difference between `display: flex` and `display: grid`. When do you prefer one?',
      'What are Web Workers and when would you use them in a frontend application?',
      'Describe the Critical Rendering Path and how you would optimize it.',
      'What is a Content Security Policy (CSP) and how does it protect against XSS?',
      'How does the React Context API differ from Redux? When should you use each?',
      'What is the difference between server-side rendering (SSR) and client-side rendering (CSR)?',
      'Explain how `async/await` works under the hood with the JavaScript event loop.',
      'How would you design a reusable modal component in React that can be opened from anywhere?',
      'What is tree shaking and how does it reduce bundle size in Webpack or Vite?',
      'How would you make a React application accessible to screen reader users?',
    ],
    'Backend Developer': [
      'Explain the full flow of a JWT-based authentication system from login to protected route access.',
      'What is database connection pooling and how does it improve API performance?',
      'How would you prevent SQL injection in a Node.js + PostgreSQL application?',
      'Describe the N+1 query problem and how you would solve it using Mongoose or Sequelize.',
      'What are the ACID properties of a database transaction? Give an example of each.',
      'How does the Node.js event loop handle async I/O? What is the call stack vs callback queue?',
      'Compare REST, GraphQL, and gRPC. When would you choose each?',
      'How would you implement idempotency in a payment API to avoid double charges?',
      'What is the difference between optimistic and pessimistic database locking?',
      'How would you design a background job system in Node.js using a queue like Bull?',
      'What are the trade-offs between using a relational database vs a document database?',
      'Explain how you would implement an API rate limiter using the token bucket algorithm.',
      'What is database indexing and how do composite indexes differ from single-column indexes?',
      'How would you structure error handling in a large Express.js application?',
      'Describe a strategy for zero-downtime database migrations in production.',
    ],
    'Full Stack Developer': [
      'Walk me through the full request lifecycle from a user clicking a button to seeing a response.',
      'How would you implement real-time notifications in a React + Node.js app?',
      'Explain the difference between cookies, localStorage, and sessionStorage for storing auth tokens.',
      'How do you manage secrets and environment variables across dev, staging, and production?',
      'What is CORS and how do you configure it properly in an Express.js server?',
      'Describe how you would implement infinite scroll with a paginated API backend.',
      'How would you structure a full-stack monorepo with a shared TypeScript types package?',
      'What is the difference between optimistic UI updates and pessimistic ones? Give an example.',
      'How would you handle file uploads in a React + Node.js app and store them in S3?',
      'Explain the OAuth 2.0 authorization code flow with PKCE for a SPA.',
      'How do you prevent your React app from making duplicate API calls on component mount?',
      'What is database connection pooling and why does it matter in a serverless deployment?',
      'How would you implement role-based access control (RBAC) in a full-stack application?',
      'Describe how you would approach migrating a monolith to microservices incrementally.',
      'How do you test an async API endpoint that depends on a third-party service?',
    ],
    'Data Scientist': [
      'Explain the bias-variance tradeoff. How do you diagnose whether your model is over or underfitting?',
      'You have 80% accuracy on a fraud detection model. Is that good? What metrics would you actually use?',
      'What is the difference between L1 (Lasso) and L2 (Ridge) regularization? When do you use each?',
      'Explain how you would handle a dataset where 95% of samples are negative (class imbalance).',
      'What is the Central Limit Theorem and why does it matter in statistical inference?',
      'Walk me through how you would design and analyze an A/B test for a new checkout flow.',
      'What is cross-validation and how does k-fold CV differ from a train/test split?',
      'Explain how gradient boosting works and how it differs from bagging (Random Forest).',
      'What is Principal Component Analysis (PCA) and when would you use it?',
      'How would you detect data drift in a production ML model?',
      'What is the difference between p-value and statistical power? What is a Type I vs Type II error?',
      'How would you approach feature selection for a dataset with 500 features?',
      'What is the difference between a parametric and a non-parametric statistical test?',
      'Explain how attention mechanisms in transformers work at a high level.',
      'How would you explain your machine learning model results to a non-technical business stakeholder?',
    ],
    'General Software Engineer': [
      'Explain Big-O notation. What is the time complexity of searching a balanced BST vs a hash map?',
      'Walk me through how you would implement a LRU (Least Recently Used) cache.',
      'What is the difference between a stack and a heap in memory management?',
      'Explain the SOLID principles. Give a real example where violating one caused a bug.',
      'How does garbage collection work? What causes a memory leak in JavaScript or Java?',
      'What is the difference between a process and a thread? What is a deadlock?',
      'How does binary search work? What are the conditions for it to be applicable?',
      'Explain dynamic programming. How do you decide between memoization and tabulation?',
      'What is the difference between depth-first search and breadth-first search? When do you use each?',
      'Describe the Observer design pattern and give a real-world use case.',
      'What is the difference between TCP and UDP? When would you choose UDP?',
      'How does a hash map handle collisions? Compare chaining and open addressing.',
      'What is tail recursion and how does it help avoid stack overflow?',
      'Explain the CAP theorem in distributed systems. What does eventual consistency mean?',
      'How would you systematically debug a bug that only reproduces in production?',
    ],
  };

  const questions = banks[role] || banks['General Software Engineer'];
  return [...questions].sort(() => Math.random() - 0.5);
};

/**
 * Evaluate a candidate's answer with AI scoring
 */
const evaluateAnswer = async (role, difficulty, question, answer) => {
  if (!answer || answer.trim().length < 5) {
    return {
      score: 0,
      feedback: 'No meaningful answer was provided. Always attempt an answer — partial answers earn partial credit!',
    };
  }

  const prompt = `You are a strict but fair senior ${role} interviewer.

Question: "${question}"
Candidate's answer: "${answer}"
Interview level: ${difficulty}

Score 0-10:
• 0-2: Wrong or completely off-topic
• 3-4: Very basic, major gaps
• 5-6: Partially correct, shows some understanding
• 7-8: Good, minor gaps or imprecise wording
• 9-10: Excellent, comprehensive, mentions edge cases

Respond with ONLY this JSON (no markdown):
{"score": <integer 0-10>, "feedback": "<2-3 sentences: what was correct, what was missing, one concrete improvement tip>"}`;

  try {
    const text = await callGemini(prompt, { temperature: 0.3, maxOutputTokens: 512 });
    const jsonMatch = text.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) throw new Error('No JSON found');

    const evaluation = JSON.parse(jsonMatch[0]);
    return {
      score: Math.max(0, Math.min(10, Math.round(Number(evaluation.score) || 5))),
      feedback: evaluation.feedback || 'Answer evaluated.',
    };
  } catch (err) {
    console.error('Gemini evaluateAnswer error:', err.message);
    return {
      score: 5,
      feedback: 'Your answer has been recorded. For a higher score, include specific examples and cover edge cases.',
    };
  }
};

/**
 * Generate a full performance report after the interview
 */
const generateReport = async (role, difficulty, questions) => {
  const qaText = questions
    .map((q, i) =>
      `Q${i + 1}: ${q.question}\nAnswer: ${q.answer || 'Not answered'}\nScore: ${q.score ?? 0}/10`
    )
    .join('\n\n');

  const avgScore = questions.reduce((s, q) => s + (q.score || 0), 0) / questions.length;

  const prompt = `You are a senior hiring manager reviewing a completed ${difficulty}-level ${role} interview.

Interview Results:
${qaText}

Average Score: ${avgScore.toFixed(1)}/10

Write a professional candidate assessment. Return ONLY this JSON (no markdown):
{
  "summary": "<2-3 sentences: overall performance, demonstrated strengths, and readiness level>",
  "strengths": ["<specific technical strength 1>", "<specific strength 2>", "<specific strength 3>"],
  "improvements": ["<specific topic to study 1>", "<specific gap 2>", "<actionable recommendation 3>"]
}`;

  try {
    const text = await callGemini(prompt, { temperature: 0.4, maxOutputTokens: 1024 });
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found');

    return JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error('Gemini generateReport error:', err.message);
    const level = avgScore >= 7 ? 'strong' : avgScore >= 5 ? 'moderate' : 'beginner-level';
    return {
      summary: `The candidate completed a ${difficulty} ${role} interview with an average score of ${avgScore.toFixed(1)}/10, showing ${level} knowledge overall. ${avgScore >= 7 ? 'They appear ready for further technical rounds.' : 'Additional preparation in core areas is recommended.'}`,
      strengths: ['Attempted all questions', 'Engaged with technical topics', 'Demonstrated foundational understanding'],
      improvements: ['Deepen knowledge of core ' + role + ' concepts', 'Practice explaining solutions clearly with examples', 'Study system design and edge cases'],
    };
  }
};

module.exports = { generateInterviewQuestions, evaluateAnswer, generateReport };
