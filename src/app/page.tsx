"use client";

import { useState, ChangeEvent } from "react";

const UploadFile = () => {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number>(0);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      return;
    }

    const chunkSize = 1024 * 1024 * 50; // 1MB
    const totalChunks = Math.ceil(file.size / chunkSize);
    let uploadedChunks = 0;

    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(file.size, start + chunkSize);
      const chunk = file.slice(start, end);

      const formData = new FormData();
      formData.append("file", chunk);
      formData.append("fileName", file.name);
      formData.append("chunkIndex", String(i + 1));
      formData.append("totalChunk", String(totalChunks));
      formData.append("chunkSize", String(chunkSize));
      formData.append(
        "data",
        JSON.stringify({
          // productId: "8002567667940",
          asin: "B0C6T381Q5",
          psdProductId: "4d4a8461-b7f2-4506-a162-0d2e70356cae",
          userId: "ba2b3f1a-a9a9-41b3-b4fc-10b2ae28319d",
          variant: [
            {
              name: "Large",
            },
          ],
          vendor: "GodGroup",
          title: "this is file title",
        })
      );

      try {
        const response = await fetch(
          "https://nas.godmerch.com/v1/file/upload",
          {
            method: "POST",
            body: formData,
            headers: {
              Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2ODg3MjM3MzQsImlhdCI6MTY4ODYzNzMzNCwidXNlcklEIjoiYmEyYjNmMWEtYTlhOS00MWIzLWI0ZmMtMTBiMmFlMjgzMTlkIiwiZW1haWwiOiJtYW5oZGtAZ29kZ3JvdXAuY28iLCJyb2xlIjoiU1VQRVJfQURNSU4ifQ.DuwTisR5B7G_vMPQnNXWDwhkniZ64fwv1VJS2MLa8e0`,
            },
            onUploadProgress: (progressEvent: {
              loaded: number;
              total: number;
            }) => {
              const progressPercent = Math.round(
                (progressEvent.loaded / progressEvent.total) * 100
              );
              setProgress(progressPercent);
            },
          }
        );

        if (response.ok) {
          uploadedChunks++;
          setProgress((uploadedChunks / totalChunks) * 100);
        } else {
          console.error("Upload error:", response.statusText);
          // Handle upload error
        }
      } catch (error) {
        console.error("Upload error:", error);
        // Handle upload error
      }
    }

    if (uploadedChunks === totalChunks) {
      // All chunks uploaded successfully
      // Handle completion
    }
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={!file}>
        Upload
      </button>
      {progress > 0 && <progress value={progress} max="100" />}
    </div>
  );
};

export default UploadFile;
