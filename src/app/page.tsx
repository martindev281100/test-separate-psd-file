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
          productId: "e19caaac-f8fc-4428-b722-3de5d533ce09",
          productTitle: "martin test",
          style: {
            background: "black",
          },
          psdUrl: "https://example.com/imageurl",
          thumbnailUrl: "https://example.com/thumbnailurl",
          name: "fileName",
          psdProductId: "12286d9b-b2f2-49e0-85a0-dfce9c1e4abd",
          userId: "ba2b3f1a-a9a9-41b3-b4fc-10b2ae28319d",
          variant: [
            {
              name: "XL",
            },
          ],
          vendor: "GG",
          title: "this is file title",
        })
      );

      try {
        const response = await fetch("http://localhost:8081/v1/file/upload", {
          method: "POST",
          body: formData,
          headers: {
            Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE2ODgyMjU0OTUsImlhdCI6MTY4ODEzOTA5NSwidXNlcklEIjoiYmEyYjNmMWEtYTlhOS00MWIzLWI0ZmMtMTBiMmFlMjgzMTlkIiwiZW1haWwiOiJtYW5oZGtAZ29kZ3JvdXAuY28iLCJyb2xlIjoiU1VQRVJfQURNSU4ifQ.1gwQ5ejhmMcnF4cl-hVpJNoqhmGN4u-Nln6NNAGvkPo`,
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
        });

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
