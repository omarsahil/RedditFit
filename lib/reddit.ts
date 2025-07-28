// Reddit API helper functions
export async function getSubredditRules(subreddit: string) {
  // Try public Reddit rules endpoint first
  try {
    const response = await fetch(
      `https://www.reddit.com/r/${subreddit}/about/rules.json`,
      {
        headers: {
          "User-Agent": "ReddiFit/1.0.0",
        },
      }
    );
    if (!response.ok) throw new Error("Failed to fetch public rules");
    const data = await response.json();
    if (data && data.rules && Array.isArray(data.rules)) {
      return {
        rules: data.rules.map((rule: any) => ({
          title: rule.short_name,
          description: rule.description,
        })),
        description: "",
        subscribers: 0,
      };
    }
  } catch (error) {
    console.error("Error fetching public subreddit rules:", error);
  }

  // Fallback rules for common subreddits when Reddit API is not available
  return getDefaultRules(subreddit);
}

// Fallback rules for common subreddits when Reddit API is not available
function getDefaultRules(subreddit: string) {
  const defaultRules: { [key: string]: any } = {
    askreddit: {
      rules: [
        {
          title: "Questions Only",
          description:
            "Posts must be questions that are open-ended and thought-provoking",
        },
        {
          title: "No Yes/No Questions",
          description: "Questions must not be answerable with yes or no",
        },
        {
          title: "No Personal Advice",
          description:
            "No requests for personal advice, relationship advice, or medical advice",
        },
        {
          title: "Title Only",
          description: "No text in the body, only the title",
        },
        {
          title: "Question Mark Required",
          description: "Titles must end with a question mark",
        },
      ],
      description: "AskReddit is for open-ended, thought-provoking questions",
      subscribers: 45000000,
    },
    programming: {
      rules: [
        {
          title: "Programming Related",
          description: "All posts must be related to programming",
        },
        {
          title: "No Homework Help",
          description: "No requests for homework help or assignments",
        },
        {
          title: "Include Code",
          description: "Include relevant code snippets when asking for help",
        },
        {
          title: "Descriptive Titles",
          description: "Use descriptive titles that explain your problem",
        },
        {
          title: "No Memes",
          description: "No memes, jokes, or low-effort content",
        },
      ],
      description: "A subreddit for programming discussions and help",
      subscribers: 5000000,
    },
    learnprogramming: {
      rules: [
        {
          title: "Learning Focus",
          description: "Posts should be about learning programming",
        },
        {
          title: "Include Details",
          description:
            "Provide context about your experience level and what you've tried",
        },
        {
          title: "Code Formatting",
          description: "Format your code properly using code blocks",
        },
        {
          title: "Be Specific",
          description: "Ask specific questions rather than vague ones",
        },
        {
          title: "No Homework",
          description: "No requests for homework solutions",
        },
      ],
      description: "A subreddit for learning programming",
      subscribers: 3000000,
    },
    funny: {
      rules: [
        {
          title: "Actually Funny",
          description: "Content must be genuinely funny",
        },
        {
          title: "No Politics",
          description: "No political content or discussions",
        },
        {
          title: "No Reposts",
          description: "No reposts from the last 30 days",
        },
        { title: "Use Flair", description: "Use appropriate post flair" },
        {
          title: "No Personal Info",
          description: "No personal information or doxxing",
        },
      ],
      description: "A place for funny content",
      subscribers: 40000000,
    },
    explainlikeimfive: {
      rules: [
        { title: "ELI5 Format", description: 'Titles must start with "ELI5:"' },
        {
          title: "Simple Explanations",
          description: "Explain complex topics in simple terms",
        },
        {
          title: "No Personal Stories",
          description: "No personal anecdotes or stories",
        },
        {
          title: "No Speculation",
          description: "No speculation or opinions, only facts",
        },
        { title: "Be Clear", description: "Ask clear, specific questions" },
      ],
      description:
        "Explain Like I'm Five - simple explanations of complex topics",
      subscribers: 20000000,
    },
    todayilearned: {
      rules: [
        {
          title: "TIL Format",
          description: 'Titles must start with "TIL" or "Today I Learned"',
        },
        {
          title: "Factual Content",
          description: "Posts must be factual and verifiable",
        },
        {
          title: "No Recent Events",
          description: "No events from the last 2 years",
        },
        {
          title: "No Personal Stories",
          description: "No personal anecdotes or experiences",
        },
        {
          title: "Cite Sources",
          description: "Include reliable sources in comments",
        },
      ],
      description: "Today I Learned - interesting facts and discoveries",
      subscribers: 30000000,
    },
  };

  const sub = subreddit.toLowerCase();
  return (
    defaultRules[sub] || {
      rules: [
        {
          title: "Be Respectful",
          description: "Be respectful and civil to other users",
        },
        {
          title: "Stay On Topic",
          description: "Keep posts relevant to the subreddit's purpose",
        },
        {
          title: "No Spam",
          description: "No spam, self-promotion, or advertising",
        },
        {
          title: "Follow Reddit Rules",
          description: "Follow Reddit's content policy and site-wide rules",
        },
        {
          title: "Use Descriptive Titles",
          description: "Use clear, descriptive titles for your posts",
        },
      ],
      description: "General Reddit community guidelines",
      subscribers: 0,
    }
  );
}

// Cache subreddit rules to avoid hitting rate limits
const ruleCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

export async function getCachedSubredditRules(subreddit: string) {
  const cacheKey = subreddit.toLowerCase();
  const cached = ruleCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  const rules = await getSubredditRules(subreddit);
  ruleCache.set(cacheKey, { data: rules, timestamp: Date.now() });
  return rules;
}
