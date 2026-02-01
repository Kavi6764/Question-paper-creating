/**
 * Utility functions for question paper visibility and time management
 */

/**
 * Check if a question paper can be viewed based on publication time
 * @param {Object} questionPaper - The question paper object
 * @returns {boolean} - True if the paper can be viewed, false otherwise
 */
export const canViewQuestionPaper = (questionPaper) => {
  if (!questionPaper.publicationDate || !questionPaper.publicationTime) {
    return false;
  }
  
  try {
    const now = new Date();
    const [hours, minutes] = questionPaper.publicationTime.split(':').map(Number);
    
    if (isNaN(hours) || isNaN(minutes)) {
      console.error("Invalid publication time format");
      return false;
    }
    
    const publicationDate = new Date(questionPaper.publicationDate);
    publicationDate.setHours(hours, minutes, 0, 0);
    
    // Add buffer of 1 minute to account for clock differences
    const buffer = 60 * 1000; // 1 minute in milliseconds
    return now.getTime() >= (publicationDate.getTime() - buffer);
  } catch (error) {
    console.error("Error checking publication time:", error);
    return false;
  }
};

/**
 * Get time remaining until publication
 * @param {Object} questionPaper - The question paper object
 * @returns {Object|null} - Object with hours and minutes, or null if already published
 */
export const getTimeUntilPublication = (questionPaper) => {
  if (!questionPaper.publicationDate || !questionPaper.publicationTime) {
    return null;
  }
  
  try {
    const now = new Date();
    const [hours, minutes] = questionPaper.publicationTime.split(':').map(Number);
    
    if (isNaN(hours) || isNaN(minutes)) {
      return null;
    }
    
    const publicationDate = new Date(questionPaper.publicationDate);
    publicationDate.setHours(hours, minutes, 0, 0);
    
    const diff = publicationDate.getTime() - now.getTime();
    
    if (diff <= 0) return null;
    
    const hoursLeft = Math.floor(diff / (1000 * 60 * 60));
    const minutesLeft = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return { hours: hoursLeft, minutes: minutesLeft };
  } catch (error) {
    console.error("Error calculating time until publication:", error);
    return null;
  }
};

/**
 * Format time until publication as a string
 * @param {Object} questionPaper - The question paper object
 * @returns {string} - Formatted time string or empty string
 */
export const getTimeUntilPublicationString = (questionPaper) => {
  const timeLeft = getTimeUntilPublication(questionPaper);
  if (!timeLeft) return "";
  
  if (timeLeft.hours > 0) {
    return `${timeLeft.hours}h ${timeLeft.minutes}m`;
  } else {
    return `${timeLeft.minutes}m`;
  }
};

