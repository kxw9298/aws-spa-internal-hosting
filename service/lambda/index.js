import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({});

export const handler = async (event) => {
    console.log('Received event:', JSON.stringify(event, null, 2)); // Log the received event

    const bucketName = process.env.BUCKET_NAME;
    let objectKey = event.path.substring(1); // Remove leading '/' from the path

    // Default to 'index.html' if no object key is provided
    if (!objectKey || objectKey.endsWith('/')) {
        objectKey = 'index.html';
    }

    console.log('Object Key:', objectKey); // Log the object key

    try {
        const command = new GetObjectCommand({
            Bucket: bucketName,
            Key: objectKey,
        });
        const data = await s3.send(command);

        const body = await streamToString(data.Body);

        return {
            statusCode: 200,
            headers: { 'Content-Type': data.ContentType },
            body: body,
            isBase64Encoded: false,
        };
    } catch (error) {
        console.error('Error:', error);
        // Handle specific errors (e.g., object not found) as needed
        return {
            statusCode: error.statusCode || 500,
            body: error.message || 'Internal Server Error',
        };
    }
};

// Helper function to convert a stream to a string
async function streamToString(stream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('error', reject);
        stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    });
}
