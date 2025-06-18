import type { Schema } from "@/amplify/data/resource";
import type { FeedbackLevel } from "@/components/review/SrsFeedback";

// Define the type for a full Card object from your schema
type FullCard = Schema["Card"]["type"];

const MIN_EASE_FACTOR = 1.3;

/**
 * Calculates the next SRS interval, ease factor, and due date for a card.
 * Based on a variant of the SM-2 algorithm.
 *
 * @param level The user's feedback ("Again", "Hard", "Good", "Easy").
 * @param card The original card object with its current SRS state.
 * @returns An object with the new srsInterval, srsEaseFactor, and srsDueDate.
 */
export function calculateSrsUpdate(level: FeedbackLevel, card: FullCard) {
  let newEaseFactor = card.srsEaseFactor;
  let newInterval: number;

  if (level === "Again") {
    // Card forgotten, reset interval and penalize ease factor
    newInterval = 1;
    newEaseFactor = Math.max(MIN_EASE_FACTOR, card.srsEaseFactor - 0.2);
  } else {
    // First successful review
    if (card.srsInterval === 1 && level !== "Hard") {
      newInterval = 6;
    } else {
      // Subsequent reviews
      if (level === "Hard") {
        newEaseFactor = Math.max(MIN_EASE_FACTOR, card.srsEaseFactor - 0.15);
        newInterval = card.srsInterval * 1.2; // Increase less
      } else if (level === "Easy") {
        newEaseFactor = card.srsEaseFactor + 0.15; // Bonus
        newInterval = card.srsInterval * card.srsEaseFactor * 1.3; // Increase more
      } else {
        // "Good"
        // Standard interval calculation
        newInterval = card.srsInterval * card.srsEaseFactor;
      }
    }
  }

  // Round the interval to the nearest whole number of days
  newInterval = Math.ceil(newInterval);
  if (newInterval < 1) newInterval = 1;

  // Calculate the next due date
  const today = new Date();
  const newDueDate = new Date(today.setDate(today.getDate() + newInterval));

  return {
    srsInterval: newInterval,
    srsEaseFactor: parseFloat(newEaseFactor.toFixed(2)),
    // Amplify Date type expects a 'YYYY-MM-DD' formatted string
    srsDueDate: newDueDate.toISOString().split("T")[0],
  };
}
