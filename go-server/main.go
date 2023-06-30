package main

import (
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

const (
	uploadDir = "./uploads"
	chunkSize = 50 * 1024 * 1024 // 50MB
)

func main() {
	if err := os.MkdirAll(uploadDir, os.ModePerm); err != nil {
		log.Fatal(err)
	}

	r := gin.Default()
	r.POST("/v1/file/upload", handleUpload)
	r.Run(":8082")
}

func handleUpload(c *gin.Context) {
	fileHeader, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "File upload failed"})
		return
	}

	filename := c.PostForm("filename")
	fileExt := filepath.Ext(filename)
	fileNameWithoutExt := strings.TrimSuffix(filename, fileExt)

	chunkIndex, _ := strconv.Atoi(c.PostForm("chunkindex"))
	totalChunks, _ := strconv.Atoi(c.PostForm("totalchunks"))

	// Create path file name
	chunkPath := filepath.Join(uploadDir, fmt.Sprintf("%s.part%d", fileNameWithoutExt, chunkIndex))
	out, err := os.Create(chunkPath)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error creating chunk file"})
		return
	}
	defer out.Close()

	file, err := fileHeader.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error opening file"})
		return
	}
	defer file.Close()

	buffer := make([]byte, chunkSize)
	for {
		n, err := file.Read(buffer)
		if err != nil && err != io.EOF {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error reading file"})
			return
		}

		if n == 0 {
			break
		}

		// Write file buffer to chunk file
		_, err = out.Write(buffer[:n])
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error writing chunk file"})
			return
		}
	}

	if chunkIndex == totalChunks {
		// Create a final file to merge all the chunks
		mergedFilePath := filepath.Join(uploadDir, filename)
		mergedFile, err := os.Create(mergedFilePath)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error creating merged file"})
			return
		}
		defer mergedFile.Close()

		for i := 1; i <= totalChunks; i++ {
			// Find chunk file path
			chunkPath := filepath.Join(uploadDir, fmt.Sprintf("%s.part%d", fileNameWithoutExt, i))
			chunkFile, err := os.Open(chunkPath)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Error opening chunk file"})
				return
			}
			defer chunkFile.Close()

			_, err = io.Copy(mergedFile, chunkFile)
			if err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Error merging chunks"})
				return
			}

			os.Remove(chunkPath) // Remove chunk file after merging
		}

		// Rename the merged file to the original filename
		err = os.Rename(mergedFilePath, filepath.Join(uploadDir, filename))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Error renaming the merged file"})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "File upload successful"})
	} else {
		c.JSON(http.StatusOK, gin.H{"message": "Chunk upload successful"})
	}
}
