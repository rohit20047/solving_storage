require('dotenv').config();
const { S3Client } = require("@aws-sdk/client-s3");
const { Upload } = require("@aws-sdk/lib-storage");
const busboy = require("busboy");
const process = require("process");

// Set up AWS S3 bucket configuration
const s3 = new S3Client({
  region: process.env.YOUR_BUCKET_REGION,
  credentials: {
    accessKeyId: process.env.YOUR_ACCESS_KEY,
    secretAccessKey: process.env.YOUR_SECRET_KEY,
  },
  useAccelerateEndpoint: true,
});

const bucketName = process.env.YOUR_BUCKET_NAME;

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' }),
      headers: {
        'Allow': 'POST',
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    };
  }

  try {
    // Parse the multipart form data using busboy
    const fields = await parseMultipartForm(event);

    if (!fields.file || !fields.file.content) {
      throw new Error('File upload failed or file content is missing');
    }

    const fileContent = fields.file.content;
    const fileName = `${Date.now().toString()}_${fields.filename}`;

    // S3 upload params
    const params = {
      Bucket: bucketName,
      Key: `uploads/${fileName}`,
      Body: fileContent,
    };
    
     
    // Upload to S3 using lib-storage
    const uploadParallel = new Upload({
      client: s3,
      queueSize: 4,
      partSize: 5542880,
      leavePartsOnError: false,
      params,
    });

    uploadParallel.on("httpUploadProgress", (progress) => {
      console.log("Upload progress:", progress);
    });

    const data = await uploadParallel.done();

    
    fileUrl = data.Location;

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, data: fileUrl }),
      headers: {
        ContentType:  'application/pdf',
        'Access-Control-Allow-Origin': '*',
      },
    };
  } catch (error) {
    console.error('Caught error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: error.message }),
      headers: {
        ContentType:  'application/pdf',
        'Access-Control-Allow-Origin': '*',
      },
    };
  }
};

// Function to parse multipart form data using busboy
function parseMultipartForm(event) {
  return new Promise((resolve, reject) => {
    const fields = {};
    const bb = busboy({ headers: event.headers });

    bb.on('file', (name, file, info) => {
      const { filename, mimeType } = info;
      const buffers = [];
      file.on('data', (data) => {
        buffers.push(data);
      }).on('end', () => {
        fields[name] = {
          filename,
          mimeType,
          content: Buffer.concat(buffers),
        };
      });
    });

    bb.on('field', (name, value) => {
      fields[name] = value;
    });

    bb.on('close', () => {
      resolve(fields);
    });

    bb.on('error', (err) => {
      reject(err);
    });

    bb.end(Buffer.from(event.body, 'base64'));
  });
}