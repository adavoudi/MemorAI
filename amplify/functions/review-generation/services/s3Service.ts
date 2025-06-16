import { GetObjectCommand } from "@aws-sdk/client-s3";
import { config } from "../config";

const { s3 } = config.clients;

/**
 * Retrieves the content of a text file from an S3 bucket.
 * @param bucketName The name of the S3 bucket.
 * @param key The key (path) of the file in the bucket.
 * @returns A promise that resolves to the string content of the file.
 */
export const getTextFromS3 = async (
  bucketName: string,
  key: string
): Promise<string> => {
  console.log(`Downloading file: s3://${bucketName}/${key}`);
  const command = new GetObjectCommand({ Bucket: bucketName, Key: key });

  try {
    const response = await s3.send(command);
    if (!response.Body) {
      throw new Error("S3 object body is empty.");
    }
    const bodyContents = await response.Body.transformToString("utf-8");
    console.log(`Successfully downloaded file from s3://${bucketName}/${key}`);
    return bodyContents;
  } catch (error) {
    console.error(
      `Failed to download file from S3 (s3://${bucketName}/${key}):`,
      error
    );
    throw new Error(`Could not retrieve file from S3`, { cause: error });
  }
};
