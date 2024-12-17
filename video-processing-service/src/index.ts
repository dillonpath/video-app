import express from "express";
import ffmpeg from "fluent-ffmpeg";
import { 
    uploadProcessedVideo,
    downloadRawVideo,
    deleteRawVideo,
    deleteProcessedVideo,
    convertVideo,
    setUpDirectories
  } from './storage';
import {isVideoNew, setVideo} from "./firestore"

setUpDirectories();

const app = express();
app.use(express.json());

app.post('/process-video', async (req: any, res: any) => {

    // Get the bucket and filename from the Cloud Pub/Sub message
    let data;
    try {
      const message = Buffer.from(req.body.message.data, 'base64').toString('utf8');
      data = JSON.parse(message);
      if (!data.name) {
        throw new Error('Invalid message payload received.');
      }
    } catch (error) {
      console.error(error);
      return res.status(400).send('Bad Request: missing filename.');
    }
  
    const inputFileName = data.name;
    const outputFileName = `processed-${inputFileName}`;
    const videoId = inputFileName.split('.')[0];

    if (!isVideoNew(videoId)) {
      return res.status(400).send(`Bad request: video already processing or processed`);
    } else {
      await setVideo(videoId, {
        id: videoId,
        uid:videoId.split('-')[0],
        status: "processing"
      });
    }
  
    // Download the raw video from Cloud Storage
    await downloadRawVideo(inputFileName);
  
    // Process the video into 360p
    try { 
      await convertVideo(inputFileName, outputFileName)
    } catch (err) {
      await Promise.all([
        deleteRawVideo(inputFileName),
        deleteProcessedVideo(outputFileName)
      ]);
      return res.status(500).send('Processing failed');
    }
    
    // Upload the processed video to Cloud Storage
    await uploadProcessedVideo(outputFileName);
  
    await setVideo(videoId, {
      status: 'processed',
      filename: outputFileName
    });

    await Promise.all([
      deleteRawVideo(inputFileName),
      deleteProcessedVideo(outputFileName)
    ]);
  
    return res.status(200).send('Processing finished successfully');
  });
const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });