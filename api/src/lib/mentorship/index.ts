/**
 * Mentorship Network Module
 * Handles mentor/mentee matching, session scheduling, and progress tracking
 */

export interface MentorSearchFilters {
  expertise?: string[];
  availability?: string;
  minRating?: number;
  languages?: string[];
  maxMentees?: boolean; // only show mentors with capacity
}

export interface MentorMatchScore {
  mentorId: string;
  score: number;
  matchReasons: string[];
}

/**
 * Match mentees with mentors based on goals, expertise, and availability
 */
export function matchMentors(
  menteeGoals: string[],
  menteeFocusAreas: string[],
  availableMentors: Array<{
    id: string;
    expertise: string[];
    availability: string;
    currentMentees: number;
    maxMentees: number;
    rating: number;
    totalSessions: number;
  }>
): MentorMatchScore[] {
  return availableMentors
    .filter(m => m.availability !== 'unavailable' && m.currentMentees < m.maxMentees)
    .map(mentor => {
      let score = 0;
      const matchReasons: string[] = [];

      // Expertise overlap (40% weight)
      const allMenteeTopics = [...menteeGoals, ...menteeFocusAreas];
      const expertiseOverlap = mentor.expertise.filter(e =>
        allMenteeTopics.some(t => t.toLowerCase().includes(e.toLowerCase()) || e.toLowerCase().includes(t.toLowerCase()))
      );
      const expertiseScore = Math.min((expertiseOverlap.length / Math.max(allMenteeTopics.length, 1)) * 40, 40);
      score += expertiseScore;
      if (expertiseOverlap.length > 0) {
        matchReasons.push(`Expert in: ${expertiseOverlap.join(', ')}`);
      }

      // Rating (25% weight)
      const ratingScore = (Number(mentor.rating) / 5) * 25;
      score += ratingScore;
      if (Number(mentor.rating) >= 4) {
        matchReasons.push(`Highly rated (${mentor.rating}/5)`);
      }

      // Experience / sessions (20% weight)
      const sessionScore = Math.min((mentor.totalSessions / 100) * 20, 20);
      score += sessionScore;
      if (mentor.totalSessions >= 50) {
        matchReasons.push(`Experienced (${mentor.totalSessions} sessions)`);
      }

      // Availability (15% weight)
      if (mentor.availability === 'available') {
        score += 15;
        matchReasons.push('Currently available');
      } else if (mentor.availability === 'limited') {
        score += 7;
        matchReasons.push('Limited availability');
      }

      return { mentorId: mentor.id, score: Math.round(score), matchReasons };
    })
    .sort((a, b) => b.score - a.score);
}

/**
 * Calculate mentorship progress percentage
 */
export function calculateProgress(
  milestones: string[],
  totalGoals: number,
  sessionsCompleted: number,
  programType: string
): { percentage: number; status: string; daysRemaining?: number } {
  const expectedSessions: Record<string, number> = {
    '90_day': 12,
    '6_month': 24,
    'annual': 48,
    'open_ended': 100,
  };

  const expected = expectedSessions[programType] || 24;
  const milestoneWeight = 0.6;
  const sessionWeight = 0.4;

  const milestoneProgress = totalGoals > 0 ? (milestones.length / totalGoals) * 100 : 0;
  const sessionProgress = Math.min((sessionsCompleted / expected) * 100, 100);

  const percentage = Math.round(milestoneProgress * milestoneWeight + sessionProgress * sessionWeight);

  let status = 'on_track';
  if (percentage >= 100) {
    status = 'completed';
  } else if (percentage < 25 && sessionsCompleted < 3) {
    status = 'getting_started';
  } else if (percentage < 50) {
    status = 'in_progress';
  } else {
    status = 'advanced';
  }

  return { percentage: Math.min(percentage, 100), status };
}

/**
 * Generate recommended session topics based on mentee goals and progress
 */
export function suggestSessionTopics(
  goals: string[],
  completedTopics: string[],
  focusAreas: string[]
): string[] {
  const topicMap: Record<string, string[]> = {
    real_estate: ['Market analysis basics', 'Property evaluation criteria', 'Negotiation strategies', 'Due diligence checklist'],
    investing: ['Risk assessment framework', 'Portfolio diversification', 'ROI calculation methods', 'Exit strategy planning'],
    tax: ['Tax deduction strategies', 'Entity structuring', 'Quarterly filing prep', 'Year-end tax planning'],
    first_time_buyer: ['Pre-qualification process', 'Down payment strategies', 'Home inspection guide', 'Closing process walkthrough'],
    financing: ['Mortgage options comparison', 'Credit score optimization', 'Refinancing strategies', 'Creative financing methods'],
    property_analysis: ['Comparable sales analysis', 'Cap rate calculations', 'Cash flow projections', 'Neighborhood evaluation'],
    negotiation: ['Offer strategy', 'Counter-offer techniques', 'Contingency management', 'Closing negotiation'],
    wealth_building: ['Generational wealth planning', 'Asset protection', 'Estate planning basics', 'Passive income strategies'],
  };

  const suggestions: string[] = [];
  const allAreas = [...goals, ...focusAreas];

  for (const area of allAreas) {
    const topics = topicMap[area.toLowerCase()] || [];
    for (const topic of topics) {
      if (!completedTopics.includes(topic) && !suggestions.includes(topic)) {
        suggestions.push(topic);
      }
    }
  }

  return suggestions.slice(0, 5);
}
