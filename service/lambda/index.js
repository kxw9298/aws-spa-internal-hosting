import AWS from 'aws-sdk';

const s3 = new AWS.S3();

export const handler = async (event) => {
    const bucketName = process.env.BUCKET_NAME;
    const objectKey = event.path; // Adjust based on the incoming request format

    try {
        const data = await s3.getObject({
            Bucket: bucketName,
            Key: objectKey,
        }).promise();

        return {
            statusCode: 200,
            headers: { 'Content-Type': data.ContentType },
            body: data.Body.toString('base64'),
            isBase64Encoded: true,
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: 'Internal Server Error',
        };
    }
};
