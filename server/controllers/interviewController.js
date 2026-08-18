const Interview = require('../models/Interview');
const User = require('../models/User');
const Report = require('../models/Report');
const { generateInterviewQuestions, evaluateAnswer, generateReport } = require('../services/groqService');

// @desc  Start a new interview
// @route POST /api/interview/start
const startInterview = async (req, res, next) => {
  try {
    const { role, difficulty, totalQuestions } = req.body;

    if (!role || !difficulty) {
      return res.status(400).json({ success: false, message: 'Role and difficulty are required' });
    }
   // this is a good method
   // in this first the forntend gives u the string o f no of questions
   // if user writes some string whic hwill be converted to the number  and if user doesn't give then by default 5 questions will be taken for max then 
   // it will be compare and max will be taken out of userinput if given or 5  and 3
   // then the minimum of 15 and the max will be consider as no of uestions
   // we do this to restrict the nof questions as users should get atleast answer 3 questoins to look like an interview
    const count = Math.min(Math.max(parseInt(totalQuestions) || 5, 3), 15);
   
    // Generate questions using Gemini AI
    // this fucntion genertae interview question is in services folder
    const questionTexts = await generateInterviewQuestions(role, difficulty, count);
    // this is importnat step
    // the question text which we get form above ststemnt AI 
    // now it maps like this . questions will be retirned in parenthessi as i have done{question1: what is node js}
    // {question2: what is react}
    // map loops in every item in the question texts
    // q=> it is an arrwo fucnoin it tells that take the current item and call it q
    //
    const questions = questionTexts.map(q => ({ question: q }));
    const interview = await Interview.create({
      userId: req.user._id,
      role,
      difficulty,
      totalQuestions: count,
      questions,
      status: 'active',
      startedAt: new Date(),
    });
    res.status(201).json({
      success: true,
      interview: {
        _id: interview._id,
        role: interview.role,
        difficulty: interview.difficulty,
        totalQuestions: interview.totalQuestions,
        currentQuestionIndex: 0,
        currentQuestion: interview.questions[0].question,
        status: interview.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc  Submit an answer and get next question
// @route POST /api/interview/answer
const submitAnswer = async (req, res, next) => {
  try {
    const { interviewId, answer, timeTaken, skipped } = req.body;
   // we have used here user id and interbview id so that iser A cannot submit answers to users 'B interview by guessing their ID
   // as we are using JWT but after the auhtetication if we user goes to postman and changes the interview no then can access the differen tpeople intervioew
    const interview = await Interview.findOne({ _id: interviewId, userId: req.user._id });
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found' });
    }
   // prevents to submitting the completed interview
    if (interview.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Interview is not active' });
    }
    // in this we use from the models the interview current queion index and get the index at which we are at
    const currentIndex = interview.currentQuestionIndex;
    const currentQuestion = interview.questions[currentIndex];

    // Evaluate the answer with AI
    // at default we It assumes the question was skipped. It sets up a default evaluation of 0 points and a generic "skipped" message.
    let evaluation = { score: 0, feedback: 'Question skipped.' };
    // It checks if the user actually provided an answer (!skipped, the answer exists, and it isn't just empty spaces answer.trim()).
    //If a real answer was given, it sends the context (job role, difficulty, the question, and the user's answer) to your evaluateAnswer function, which asks the AI to grade it and provide feedback.
    if (!skipped && answer && answer.trim()) {
      evaluation = await evaluateAnswer(
        interview.role,
        interview.difficulty,
        currentQuestion.question,
        answer
      );
    }
    // storing the result
    // Update current question
    // after that thsi will be  stored in the interview database along with  the question index
    //!skipped (in your if statement) means "NOT skipped": it flips the value to verify the user actually tried to answer the question before wasting time running the AI grader.
    // !!skipped (when saving to the database) acts as a type converter: it forces whatever messy data came from the frontend (like a string or undefined) into a strict true or false boolean for safe storage.
    interview.questions[currentIndex].answer = answer || '';
    interview.questions[currentIndex].score = evaluation.score;
    interview.questions[currentIndex].feedback = evaluation.feedback;
    interview.questions[currentIndex].timeTaken = timeTaken || 0;
    interview.questions[currentIndex].skipped = !!skipped;
  // going to the next indec
    const nextIndex = currentIndex + 1;
    // and checking if this i slast question index or not
    const isLastQuestion = nextIndex >= interview.totalQuestions;

    interview.currentQuestionIndex = nextIndex;
  // if it is the last question then make the interview ended after qnswering and save it 
    if (isLastQuestion) {
      interview.status = 'completed';
      interview.completedAt = new Date();
    }
  // save the interview in the database
    await interview.save();
// after saving the daat now we talk ot the frontend that we have save ur daat in the database and 
// now we send it to the frontend taht give the next question 
    const responseData = {
      success: true,
      questionFeedback: evaluation,
      isLastQuestion,
    };
// In JavaScript, arrays use zero-based indexing, so the computer starts counting 
// questions at zero. I added + 1 to translate that backend index into a human-readable number
//  for the frontend, ensuring the user sees a logical 'Question 1' instead of a confusing 'Question 0
    if (!isLastQuestion) {
      responseData.nextQuestion = {
        question: interview.questions[nextIndex].question,
        questionNumber: nextIndex + 1,
        totalQuestions: interview.totalQuestions,
      };
    }

    res.json(responseData);
  } catch (error) {
    next(error);
  }
};

// @desc  Complete interview & generate report
// @route POST /api/interview/complete
const completeInterview = async (req, res, next) => {
  try {
    const { interviewId } = req.body;

    const interview = await Interview.findOne({ _id: interviewId, userId: req.user._id });
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found' });
    }
    // Force complete if not already
    if (interview.status !== 'completed') {
      interview.status = 'completed';
      interview.completedAt = new Date();
      await interview.save();
    }
    // Check if report already exists
    // if by mistake the user submits twice the interview then chekc if taht interview exists or not if exists retun the score 
    const existingReport = await Report.findOne({ interviewId });
    if (existingReport) {
      return res.json({ success: true, reportId: existingReport._id });
    }
    // Calculate overall score
    // first the .filetr( )will remove all questions  taht are skipped skip that 
    const scoredQuestions = interview.questions.filter(q => q.score !== null);
    // the ternary operator
    // It asks a question: scoredQuestions.length > 0 (Did the user actually answer any questions?)
   //If Yes (after the ?), it runs the math to calculate the average.
    // If No (after the :), it just sets the overallscore to 0.
// the reduce funcion
// .reduce() is a powerful array method used to boil a list of items down to a single value. Here is how it acts like a running calculator:
// 0: This is the starting value. The calculator starts at zero.
// sum: This is the running total.
//q: This is the current question in the loop.
//sum + q.score: It takes the current running total, adds the score of the current question, and updates the total.
// then we will be calculaitn the average by the length
    const overallScore = scoredQuestions.length > 0
      ? scoredQuestions.reduce((sum, q) => sum + q.score, 0) / scoredQuestions.length
      : 0;
    interview.overallScore = parseFloat(overallScore.toFixed(1));
    await interview.save();

    // Generate AI report
    const aiReport = await generateReport(interview.role, interview.difficulty, interview.questions);

    // Save report
    const report = await Report.create({
      interviewId: interview._id,
      userId: req.user._id,
      overallScore: parseFloat(overallScore.toFixed(1)),
      summary: aiReport.summary,
      strengths: aiReport.strengths,
      improvements: aiReport.improvements,
      questionBreakdown: interview.questions.map(q => ({
        question: q.question,
        score: q.score || 0,
        feedback: q.feedback || '',
      })),
    });

    // Update user stats
    
    const user = await User.findById(req.user._id);
    // this calculates the average in o(1) time complxity 
    // by getting the averga escore of past interviews and then adding this score divided by the totalinterviwews+1 whihc is done
    const totalInterviews = user.totalInterviews + 1;
    const newAvg = ((user.averageScore * user.totalInterviews) + overallScore) / totalInterviews;
// It rounds that new average score to one decimal place (like 85.4) so the database stays clean, saves the user profile, and finally tells the frontend: "Success! Here is the ID of the final report.
    user.totalInterviews = totalInterviews;
    user.averageScore = parseFloat(newAvg.toFixed(1));
    await user.save();

    res.json({ success: true, reportId: report._id });
  } catch (error) {
    next(error);
  }
};

// Helper function to auto-complete abandoned interviews
// he function accepts a userId, meaning it probably runs every time a user logs into their dashboard to clean up their specific mess.
const autoCompleteAbandonedInterviews = async (userId) => {
  try {
    // It takes the exact time right now (Date.now()), subtracts 2 hours, and saves that exact timestamp.
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    
    const abandonedInterviews = await Interview.find({
      userId,
      // The interview was never finished or submitted.
      status: 'active',
      // his is a special MongoDB operator. $lt stands for Less Than. It tells the database: "
      // Find interviews where the start time is LESS THAN (older than) the two-hour cutoff we 
      // just calculated."
      startedAt: { $lt: twoHoursAgo }
    });

    for (const interview of abandonedInterviews) {
      // loops through all the abondone interviews
      // It sets their totalScore to 0
      let totalScore = 0;
      // if (q.score !== null): It checks if the question actually has a score. (If the user abandoned the test on Question 3, Questions 4 and 5 will likely have a score of null). If a score exists, it adds it to the totalScore.
      interview.questions.forEach(q => {
        if (q.score !== null) {
          totalScore += q.score;
        }
      });
// t makes sure the test actually had questions. (In programming, dividing by zero causes massive errors).
// If the score is 3.3333333, this chops it down to just one decimal point (3.3).
//actually turns the number into a string (text). parseFloat turns it back into a true number so the database accepts it properly.
      const overallScore = interview.totalQuestions > 0 
        ? parseFloat((totalScore / interview.totalQuestions).toFixed(1))
        : 0;
// It changes the status from 'active' to 'completed', stamps it with the exact date/time it was closed, assigns the calculated score, and saves the updated document back to the MongoDB database.
      interview.status = 'completed';
      interview.completedAt = new Date();
      interview.overallScore = overallScore;
      
      await interview.save();
// It first checks if a report somehow already exists (findOne).
      const existingReport = await Report.findOne({ interviewId: interview._id });
// If not, it uses Report.create to generate a hardcoded "Penalty Report." It gives them a generic summary explaining why their score is so low.
      if (!existingReport) {
        await Report.create({
          interviewId: interview._id,
          userId: userId,
          overallScore: overallScore,
          summary: "This interview was abandoned midway. The score is calculated based on completed answers, with unanswered questions counting as 0.",
          strengths: ["Started the interview"],
          improvements: ["Complete all questions in future interviews"],
          // It loops (.map) through the questions. For any question they skipped, the || (OR) operator kicks in. It assigns a score of 0 and a default feedback string: "Question was not answered." This ensures the Results Page chart you showed me earlier won't crash when trying to draw the graph!
          questionBreakdown: interview.questions.map(q => ({
            question: q.question,
            score: q.score || 0,
            feedback: q.feedback || 'Question was not answered.',
          })),
        });
        
        const user = await User.findById(userId);
        // instead of looping through every interview they have ever taken to calculate a new average (which would be slow and expensive), it uses a Weighted Moving Average formula.
// It multiplies their old average by their old total to get their lifetime total points. Then it adds this new overallScore, and divides by the new total number of interviews.
        if (user) {
          const totalInterviews = user.totalInterviews + 1;
          const newAvg = ((user.averageScore * user.totalInterviews) + overallScore) / totalInterviews;
          user.totalInterviews = totalInterviews;
          user.averageScore = parseFloat(newAvg.toFixed(1));
          await user.save();
        }
      }
    }
  } catch (error) {
    console.error("Error auto-completing abandoned interviews:", error);
  }
};

// @desc  Get interview history
// @route GET /api/interview/history
const getHistory = async (req, res, next) => {
  try {
    // Clean up any abandoned interviews before fetching history
    // old on, let me quickly check if you left any interviews running. If you did, I'll close them and grade them right now
    await autoCompleteAbandonedInterviews(req.user._id);

    const interviews = await Interview.find({ userId: req.user._id })
    // t grabs all interviews belonging to the logged-in user.
    // It puts the newest, most recent interviews at the very top of the list, which is exactly what a user expects to see.
      .sort({ createdAt: -1 })
      // to only select this items
      .select('role difficulty status overallScore totalQuestions startedAt completedAt createdAt')
      // It stops grabbing data after 20 results. If a user has done 500 interviews, pulling all of them at once would crash the browser.
      .limit(20);

    res.json({ success: true, interviews });
  } catch (error) {
    next(error);
  }
};

// @desc  Get single interview
// @route GET /api/interview/:id
const getInterview = async (req, res, next) => {
  try {
    const interview = await Interview.findOne({ _id: req.params.id, userId: req.user._id });
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found' });
    }
    res.json({ success: true, interview });
  } catch (error) {
    next(error);
  }
};

module.exports = { startInterview, submitAnswer, completeInterview, getHistory, getInterview };
