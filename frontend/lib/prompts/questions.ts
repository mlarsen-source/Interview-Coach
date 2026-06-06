export interface InterviewQuestion {
  id: number;
  text: string;
}

export const INTRO_QUESTION: InterviewQuestion = {
  id: 0,
  text: "Tell me about yourself — walk me through your background, what got you interested in software development, what you've been working on recently, and what you're looking for in your next role.",
};

export const QUESTIONS: InterviewQuestion[] = [
  {
    id: 1,
    text: "Walk me through what happens from the moment a user types a URL into their browser until the webpage appears on their screen. Include as much detail as you can about each step in that process.",
  },
  {
    id: 2,
    text: "Explain the concept of version control and describe your typical workflow when starting a new feature using Git, from creating a branch all the way through getting your code merged.",
  },
  {
    id: 3,
    text: "Describe the difference between synchronous and asynchronous programming. Explain how async and await work in JavaScript and walk me through a real scenario where you would choose async over synchronous code.",
  },
  {
    id: 4,
    text: "Explain what a REST API is, how it works, and describe the key principles that make an API RESTful. Then walk me through what a typical request and response cycle looks like.",
  },
  {
    id: 5,
    text: "Walk me through the four main pillars of object-oriented programming — encapsulation, abstraction, inheritance, and polymorphism — and give me a concrete example of each one.",
  },
  {
    id: 6,
    text: "Explain what a database index is, describe how it works under the hood, and walk me through the tradeoffs you would consider when deciding whether or not to add an index to a table.",
  },
  {
    id: 7,
    text: "Describe the software development lifecycle. Walk me through each phase from requirements gathering through deployment and maintenance, and explain where testing fits into each stage.",
  },
  {
    id: 8,
    text: "Explain the difference between a stack and a queue as data structures. Describe how each one works, give a real-world example of where each is used, and explain how you would implement them.",
  },
  {
    id: 9,
    text: "Walk me through your approach to debugging a production issue where users are reporting that the application is running slowly. What steps would you take, what tools would you use, and how would you communicate along the way?",
  },
  {
    id: 10,
    text: "Explain the concept of separation of concerns in software development. Describe what it means, why it matters, and walk me through what a codebase looks like when this principle is ignored versus when it is applied well.",
  },
  // Soft skill / behavioral questions
  {
    id: 11,
    text: "Tell me about a time you faced a significant technical challenge or made a mistake on a project. What happened, how did you handle it, and what did you learn from the experience?",
  },
  {
    id: 12,
    text: "Describe a situation where you had to work closely with someone whose working style was very different from your own. How did you adapt, and what was the outcome?",
  },
  {
    id: 13,
    text: "Tell me about a project you are particularly proud of. What was your contribution, what obstacles did you overcome, and why does it stand out to you?",
  },
  {
    id: 14,
    text: "Describe a time when you had to learn a new technology or skill quickly under pressure. How did you approach it, what resources did you use, and what was the result?",
  },
  {
    id: 15,
    text: "Tell me about a time you disagreed with a technical decision made by a teammate or manager. How did you handle the disagreement, and what happened in the end?",
  },
  {
    id: 16,
    text: "How do you prioritize your work when you have multiple deadlines competing for your attention? Walk me through your process and give me a real example of a time you had to make tough prioritization decisions.",
  },
  {
    id: 17,
    text: "Tell me about a time you received critical feedback on your work. How did you respond to it, and what did you do differently as a result?",
  },
  {
    id: 18,
    text: "Describe a situation where requirements changed significantly partway through a project you were working on. How did you handle the change, and what did you learn from that experience?",
  },
  {
    id: 19,
    text: "Tell me about a time you had to explain a complex technical concept to someone without a technical background. How did you approach it, and how did it go?",
  },
  {
    id: 20,
    text: "Where do you see yourself professionally in three to five years, and what specific steps are you taking right now to get there?",
  },
];

/** Intro question plus one pass through the full question bank. */
export const MAX_INTERVIEW_QUESTIONS = 1 + QUESTIONS.length;

export function pickRandomQuestion(usedIds: Set<number>): InterviewQuestion {
  const available = QUESTIONS.filter((q) => !usedIds.has(q.id));
  const pool = available.length > 0 ? available : QUESTIONS;
  if (available.length === 0) usedIds.clear();
  const q = pool[Math.floor(Math.random() * pool.length)];
  usedIds.add(q.id);
  return q;
}
