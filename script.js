import path from "path";
import { exec } from "child_process";
import fs from "fs";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const client = new S3Client({
  region: "ap-south-1",
  credentials: {
    accessKeyId: process.env.accessKeyId,
    secretAccessKey: process.env.secretAccessKey,
  },
});

const start = () => {
  const outDir = path.join(__dirname, "git");

  const process = exec(`cd ${outDir} && npm i && npm run build`);

  process.stdout.on("data", (data) => {
    console.log(data);
  });

  process.stdout.on("error", (error) => {
    console.log("ERROR!!! ", error);
  });

  process.on("close", async () => {
    console.log("Build Complete");

    const distDir = path.join(outDir, "dist");
    const files = fs.readdirSync(distDir);

    try{
        for (const file in files) {
            const filePath = path.join(distDir, file);
      
            if (fs.lstatSync(filePath).isDirectory()) continue;
      
            const s3Params = {
              bucket: process.env.bucketName,
              key: process.env.projectID,
              body: fs.createReadStream(filePath),
            };
      
            await PutObjectCommand(s3Params, S3Client);
          }
          console.log('Deployed')
    }
    catch(e){
        console.log('Deplyoment Failed')
    }
  });
};

start();
