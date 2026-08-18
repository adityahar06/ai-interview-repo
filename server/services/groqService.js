const Groq = require('groq-sdk');

// Ensure you have GROQ_API_KEY set in your .env
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = 'openai/gpt-oss-120b'; 

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

// this checks your server's environment variables. If you forgot to set up your API key (or if you're running it locally without one), this evaluates to true.
// It calls the fallback function (which likely contains the shuffle logic from your previous question) and uses 
// .slice(0, count) to chop the array down so it returns exactly the number of questions requested, 
// rather than the whole bank.
const generateInterviewQuestions = async (role, difficulty, count) => {
  if (!process.env.GROQ_API_KEY) {
      console.log(' GROQ_API_KEY missing, using fallback questions');
      return getFallbackQuestions(role).slice(0, count);
  }
// It tries to find the specific list of topics for the requested role (e.g., "Backend Developer") inside the TOPIC_POOLS object.
// The || (OR): If that specific role doesn't exist in your object, it safely falls back to the default "General Software Engineer" list so the app doesn't crash.
  const pool = TOPIC_POOLS[role] || TOPIC_POOLS['General Software Engineer'];
// this creates a shallow copy of the array using the spread operator (...), and then applies the quick-and-dirty Math.random() - 0.5 sorting trick.
// You now have a disposable, randomized version of the topic list, while your original TOPIC_POOLS data remains untouched.
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
// If a user asks for 10 questions, but the topic pool for that specific role only has 5 total topics, Math.min(10, 5) returns 5. 
// This ensures the .slice() method doesn't try to grab items that don't exist, which could cause
//  undefined errors later.
  const selectedTopics = shuffled.slice(0, Math.min(count, shuffled.length));
// It takes the array of chosen topics (e.g., ['React', 'CSS', 'Redux']) and transforms it into a single, highly readable string block.
// This loops through the array. t represents the topic name, and i represents its index (which starts at 0).
// ${i + 1}. ${t} formats each item into a numbered string. Because index starts at 0, adding 1 makes it human-readable.
// .join('\n'): This takes that newly formatted array and stitches it together into one giant text string, putting a newline character (\n) between each item.
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

Return ONLY a valid JSON object with a single key "questions" containing an array of exactly ${count} strings. Nothing else.
{"questions": ["Question 1?", "Question 2?", ...]} `;
// Wraps the entire process. If anything goes wrong (the API is down, the internet drops, 
// the AI returns garbage), execution immediately jumps to the catch block at the bottom.
  try {
    // Sends the prompt we built earlier to the Groq AI model and waits for the response.
    const chatCompletion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: MODEL,
//Controls the AI's creativity. A scale from 0 to 1. 0 is robotic and deterministic, while 0.9 encourages creative, highly varied interview questions.
        temperature: 0.9,
        // this tells to return the A strict instruction telling the AI engine, "Only return JSON."
        response_format: { type: 'json_object' },
    });
// Safely digs into the AI's response payload. If any part of that object structure is missing, it won't crash; it will just fall back to an empty string "".
    let text = chatCompletion.choices[0]?.message?.content || "";
    // Groq sometimes wraps JSON in markdown blocks, even when told not to.
    // Uses Regular Expressions (Regex) to strip out markdown wrappers like ```json and ``` that the AI might have added.
    // Removes any accidental blank spaces or newlines at the very beginning or end of the text.
    text = text.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
  // If the AI replied, "Sure, here are your questions: { "questions": [...] } Good luck!", 
  // this Regex ignores the conversational text and extracts only everything from the first { to the last }. 
    const jsonMatch = text.match(/\{[\s\S]*\}/);
  // If it finds no curly braces, it throws a custom error, which triggers the catch block.
    if (!jsonMatch) throw new Error('No JSON object in response');
// Converts the cleaned text string into a real JavaScript object, and extracts the questions array. If the array doesn't exist, it defaults to an empty array [].
    let parsed = JSON.parse(jsonMatch[0]);
    let questions = parsed.questions || [];
// Loops through the items, ensuring they are actually strings and trimming stray spaces.
    questions = questions
    // he .map() method loops through every item in the questions array and transforms it based on the rule you provide.
    //This is defensive programming. Just in case the AI glitched and returned a number (1) or an object ({ text: "..." }) instead of a sentence, this checks the data type.
    // If it is a string, .trim() strips away any accidental blank spaces or invisible newline characters from the beginning and end of the text. (e.g., "  What is React? " becomes "What is React?"
    // If it is not a string, it replaces the bad data with an empty string.
      .map(q => (typeof q === 'string' ? q.trim() : ''))
      // The .filter() method loops through the cleaned array. It only keeps the items that return true for the conditions inside. It uses three arguments: q (the question text), i (its current position/index), and arr (the whole array).
      // If the .map step replaced bad data with an empty string "" (0 characters), it gets deleted here.
       // If the AI had a hallucination and just returned "?" or "React", it gets deleted because it is too short to be a real interview question.
       //The indexOf() method scans the array from the beginning and returns the index of the very first time it sees that exact text.
      .filter((q, i, arr) => q.length > 15 && arr.indexOf(q) === i);

    if (questions.length < count) {
      const extras = getFallbackQuestions(role);
      questions = [...questions, ...extras].slice(0, count);
    }

    console.log(` Generated ${questions.length} unique questions for [${role}] (${difficulty}) via Groq`);
    return questions.slice(0, count);
  } catch (err) {
    console.error('Groq generateQuestions error:', err.message);
    console.log('  Using smart fallback questions');
    return getFallbackQuestions(role).slice(0, count);
  }
};
// Before even trying to talk to the AI, it checks if the user submitted an empty or incredibly short answer (less than 5 characters, like "idk" or "no").
// Every API call costs money and takes a few seconds. If the user didn't even try, there is no need to make the AI grade it. It instantly returns a 0 and hands back encouraging feedback.
const evaluateAnswer = async (role, difficulty, question, answer) => {
  if (!answer || answer.trim().length < 5) {
    return {
      score: 0,
      feedback: 'No meaningful answer was provided. Always attempt an answer — partial answers earn partial credit!',
    };
  }
// ust like the generation function, if the API key is missing, it gracefully skips the AI and returns a neutral score of 5 so the app doesn't crash.
  if (!process.env.GROQ_API_KEY) {
      return {
          score: 5,
          feedback: 'Your answer has been recorded. (API key missing for full evaluation)',
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

Respond with ONLY this JSON (no markdown, no extra text):
{"score": <integer 0-10>, "feedback": "<2-3 sentences: what was correct, what was missing, one concrete improvement tip>"}`;

  try {
    const chatCompletion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: MODEL,
        // A lower temperature (closer to 0) reduces the AI's creativity, making it a much better, more reliable judge.
        temperature: 0.3,
        response_format: { type: 'json_object' },
    });
    
    let text = chatCompletion.choices[0]?.message?.content || "";
    text = text.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();

    const jsonMatch = text.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) throw new Error('No JSON found');

    const evaluation = JSON.parse(jsonMatch[0]);
    // Because you cannot 100% trust the AI, this line guarantees the score will always be a clean integer between 0 and 10.
    // Number(...) || 5: Converts the AI's score to a number. If it fails (e.g., the AI returned "eight" instead of 8), it defaults to 5.
    // Math.round(...): Forces it to be a whole number (e.g., changes 7.5 to 8).
    // Math.max(0, Math.min(10, ...)): This restricts the number. If the AI hallucinates and gives
    //  the user a 15, Math.min forces it down to 10. If it gives a -2, Math.max forces it up to 0.
    return {
      score: Math.max(0, Math.min(10, Math.round(Number(evaluation.score) || 5))),
      feedback: evaluation.feedback || 'Answer evaluated.',
    };
  } catch (err) {
    console.error('Groq evaluateAnswer error:', err.message);
    return {
      score: 5,
      feedback: 'Your answer has been recorded. For a higher score, include specific examples and cover edge cases.',
    };
  }
};


const generateReport = async (role, difficulty, questions) => {
  const qaText = questions
  // Loops through the array of question objects and formats each one into a readable text block.
    .map((q, i) =>
      // If the user skipped the question and q.answer is empty, this safely injects "Not answered" instead of null or undefined.
      `Q${i + 1}: ${q.question}\nAnswer: ${q.answer || 'Not answered'}\nScore: ${q.score ?? 0}/10`
    )
    // Stitches the array of formatted blocks together with double line breaks for readability.
    .join('\n\n');

  const avgScore = questions.reduce((s, q) => s + (q.score || 0), 0) / questions.length;
  
  if (!process.env.GROQ_API_KEY) {
      const level = avgScore >= 7 ? 'strong' : avgScore >= 5 ? 'moderate' : 'beginner-level';
      return {
        summary: `The candidate completed a ${difficulty} ${role} interview with an average score of ${avgScore.toFixed(1)}/10, showing ${level} knowledge overall. ${avgScore >= 7 ? 'They appear ready for further technical rounds.' : 'Additional preparation in core areas is recommended.'}`,
        strengths: ['Attempted all questions', 'Engaged with technical topics', 'Demonstrated foundational understanding'],
        improvements: ['Deepen knowledge of core ' + role + ' concepts', 'Practice explaining solutions clearly with examples', 'Study system design and edge cases'],
      };
  }

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
    const chatCompletion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: MODEL,
        temperature: 0.4,
        response_format: { type: 'json_object' },
    });
    
    let text = chatCompletion.choices[0]?.message?.content || "";
    text = text.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found');

    return JSON.parse(jsonMatch[0]);
    // This code acts as a safety net. If your main AI call fails, instead of throwing an error or
    //  sending undefined back to your frontend, this block catches the failure and instantly 
    // constructs a clean, standardized report using basic logic and template strings.
  } catch (err) {
    console.error('Groq generateReport error:', err.message);
    const level = avgScore >= 7 ? 'strong' : avgScore >= 5 ? 'moderate' : 'beginner-level';
    return {
      summary: `The candidate completed a ${difficulty} ${role} interview with an average score of ${avgScore.toFixed(1)}/10, showing ${level} knowledge overall. ${avgScore >= 7 ? 'They appear ready for further technical rounds.' : 'Additional preparation in core areas is recommended.'}`,
      strengths: ['Attempted all questions', 'Engaged with technical topics', 'Demonstrated foundational understanding'],
      improvements: ['Deepen knowledge of core ' + role + ' concepts', 'Practice explaining solutions clearly with examples', 'Study system design and edge cases'],
    };
  }
};

module.exports = { generateInterviewQuestions, evaluateAnswer, generateReport };
