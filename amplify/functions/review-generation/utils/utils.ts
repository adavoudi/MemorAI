/**
 * Gets a date string in YYYY-MM-DD format, offset by a number of days.
 * @param offsetDays Number of days to offset from today. 0 is today, 1 is tomorrow.
 * @returns A date string e.g., "2025-06-13".
 */
export const getDate = (offsetDays: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().split("T")[0];
};

/**
 * Constructs the Polly SNS Topic ARN from the function's context.
 * @param invokedFunctionArn The ARN of the currently invoked Lambda function.
 * @returns The fully constructed SNS topic ARN string.
 */
export const getSnsTopicArn = (
  invokedFunctionArn: string,
  topicName: string
): string => {
  const parts = invokedFunctionArn.split(":");
  const region = parts[3];
  const accountId = parts[4];
  return `arn:aws:sns:${region}:${accountId}:${topicName}`;
};

export const getSqsQueueUrl = (
  invokedFunctionArn: string,
  queueName: string
): string => {
  const parts = invokedFunctionArn.split(":");
  const region = parts[3];
  const accountId = parts[4];
  return `https://sqs.${region}.amazonaws.com/${accountId}/${queueName}`;
};

export const chunkArray = <T>(
  arr: T[],
  minSize: number,
  maxSize: number
): T[][] => {
  const chunks: T[][] = [];
  let i = 0;
  while (i < arr.length) {
    const remaining = arr.length - i;
    if (remaining >= maxSize + minSize) {
      chunks.push(arr.slice(i, i + maxSize));
      i += maxSize;
    } else if (remaining >= minSize) {
      chunks.push(arr.slice(i, i + Math.min(remaining, maxSize)));
      i += Math.min(remaining, maxSize);
    } else {
      // The remaining items do not meet the minimum chunk size, so we stop.
      break;
    }
  }
  return chunks;
};
