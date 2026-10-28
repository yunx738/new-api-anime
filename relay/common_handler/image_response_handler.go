package common_handler

import (
	"encoding/base64"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/logger"
	"github.com/gin-gonic/gin"
)

const ImageStorageDir = "/data/images"

func ensureImageDir() {
	if err := os.MkdirAll(ImageStorageDir, 0755); err != nil {
		common.SysError("failed to create image storage directory: " + err.Error())
	}
}

// markdownImageRegex matches ![alt](data:image/png;base64,...)
var markdownImageRegex = regexp.MustCompile("!\\[([^\\]]*)\\]\\(data:(image/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=\\s]+)\\)")
// plainDataImageRegex matches data:image/png;base64,...
var plainDataImageRegex = regexp.MustCompile("data:(image/[a-zA-Z0-9.+-]+);base64,([A-Za-z0-9+/=\\s]+)")

func ProcessContentImages(c *gin.Context, content string) (string, bool) {
	if content == "" {
		return content, false
	}
	if !strings.Contains(content, "data:image/") || !strings.Contains(content, "base64,") {
		return content, false
	}
	ensureImageDir()
	modified := false
	content = markdownImageRegex.ReplaceAllStringFunc(content, func(match string) string {
		submatches := markdownImageRegex.FindStringSubmatch(match)
		if len(submatches) < 3 {
			return match
		}
		mimeType := submatches[2]
		base64Data := submatches[3]
		url := saveBase64Image(c, mimeType, base64Data)
		if url == "" {
			return match
		}
		modified = true
		return fmt.Sprintf("![image](%s)", url)
	})
	content = plainDataImageRegex.ReplaceAllStringFunc(content, func(match string) string {
		submatches := plainDataImageRegex.FindStringSubmatch(match)
		if len(submatches) < 3 {
			return match
		}
		mimeType := submatches[1]
		base64Data := submatches[2]
		url := saveBase64Image(c, mimeType, base64Data)
		if url == "" {
			return match
		}
		modified = true
		return fmt.Sprintf("![image](%s)", url)
	})
	return content, modified
}

func saveBase64Image(c *gin.Context, mimeType string, base64Data string) string {
	base64Data = strings.ReplaceAll(base64Data, " ", "")
	base64Data = strings.ReplaceAll(base64Data, "\n", "")
	base64Data = strings.ReplaceAll(base64Data, "\r", "")
	base64Data = strings.ReplaceAll(base64Data, "\t", "")
	imageBytes, err := base64.StdEncoding.DecodeString(base64Data)
	if err != nil {
		logger.LogError(c, "failed to decode base64 image: "+err.Error())
		return ""
	}
	ext := ".bin"
	switch mimeType {
	case "image/jpeg", "image/jpg":
		ext = ".jpg"
	case "image/png":
		ext = ".png"
	case "image/gif":
		ext = ".gif"
	case "image/webp":
		ext = ".webp"
	case "image/bmp":
		ext = ".bmp"
	default:
		if idx := strings.Index(mimeType, "/"); idx >= 0 {
			ext = "." + mimeType[idx+1:]
		}
	}
	filename := fmt.Sprintf("%d_%s", time.Now().UnixNano(), "img"+ext)
	filePath := filepath.Join(ImageStorageDir, filename)
	if err := os.WriteFile(filePath, imageBytes, 0644); err != nil {
		logger.LogError(c, "failed to write image file: "+err.Error())
		return ""
	}
	scheme := "http"
	if c.Request.TLS != nil || c.GetHeader("X-Forwarded-Proto") == "https" {
		scheme = "https"
	}
	host := c.Request.Host
	baseURL := fmt.Sprintf("%s://%s", scheme, host)
	return fmt.Sprintf("%s/img/%s", baseURL, filename)
}
