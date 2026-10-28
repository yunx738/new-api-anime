package controller

// 二次元主题：站点背景图（管理员上传，所有人可读）

import (
"fmt"
"io"
"net/http"
"os"
"path/filepath"
"strings"

"github.com/gin-gonic/gin"
)

const animeBgDir = "/data/anime"
const animeBgMaxSize = 15 << 20 // 15MB

var animeBgExts = map[string]string{
".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
".webp": "image/webp", ".gif": "image/gif", ".avif": "image/avif",
}

func findAnimeBg() (string, os.FileInfo) {
for ext := range animeBgExts {
p := filepath.Join(animeBgDir, "background"+ext)
if st, err := os.Stat(p); err == nil && !st.IsDir() {
return p, st
}
}
return "", nil
}

// GetAnimeBackgroundMeta 返回当前背景图版本（无背景时 exists=false）
func GetAnimeBackgroundMeta(c *gin.Context) {
p, st := findAnimeBg()
if p == "" {
c.JSON(http.StatusOK, gin.H{"success": true, "data": gin.H{"exists": false}})
return
}
c.JSON(http.StatusOK, gin.H{"success": true, "data": gin.H{
"exists":  true,
"version": st.ModTime().Unix(),
"url":     fmt.Sprintf("/api/anime/background?v=%d", st.ModTime().Unix()),
}})
}

func GetAnimeBackground(c *gin.Context) {
p, _ := findAnimeBg()
if p == "" {
c.Status(http.StatusNotFound)
return
}
c.Header("Cache-Control", "public, max-age=604800")
c.Header("Content-Type", animeBgExts[strings.ToLower(filepath.Ext(p))])
c.File(p)
}

func UploadAnimeBackground(c *gin.Context) {
c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, animeBgMaxSize+1<<20)
file, header, err := c.Request.FormFile("file")
if err != nil {
c.JSON(http.StatusOK, gin.H{"success": false, "message": "读取上传文件失败（最大 15MB）: " + err.Error()})
return
}
defer file.Close()
ext := strings.ToLower(filepath.Ext(header.Filename))
if _, ok := animeBgExts[ext]; !ok {
c.JSON(http.StatusOK, gin.H{"success": false, "message": "仅支持 jpg/png/webp/gif/avif"})
return
}
sniff := make([]byte, 512)
n, _ := io.ReadFull(file, sniff)
if ct := http.DetectContentType(sniff[:n]); !strings.HasPrefix(ct, "image/") && ext != ".avif" {
c.JSON(http.StatusOK, gin.H{"success": false, "message": "文件不是有效图片"})
return
}
if _, err := file.Seek(0, io.SeekStart); err != nil {
c.JSON(http.StatusOK, gin.H{"success": false, "message": err.Error()})
return
}
if err := os.MkdirAll(animeBgDir, 0o755); err != nil {
c.JSON(http.StatusOK, gin.H{"success": false, "message": err.Error()})
return
}
tmp := filepath.Join(animeBgDir, ".upload.tmp")
out, err := os.Create(tmp)
if err != nil {
c.JSON(http.StatusOK, gin.H{"success": false, "message": err.Error()})
return
}
written, err := io.Copy(out, io.LimitReader(file, animeBgMaxSize+1))
out.Close()
if err != nil || written > animeBgMaxSize {
os.Remove(tmp)
c.JSON(http.StatusOK, gin.H{"success": false, "message": "图片过大（最大 15MB）"})
return
}
for e := range animeBgExts {
os.Remove(filepath.Join(animeBgDir, "background"+e))
}
if err := os.Rename(tmp, filepath.Join(animeBgDir, "background"+ext)); err != nil {
c.JSON(http.StatusOK, gin.H{"success": false, "message": err.Error()})
return
}
GetAnimeBackgroundMeta(c)
}

func DeleteAnimeBackground(c *gin.Context) {
for e := range animeBgExts {
os.Remove(filepath.Join(animeBgDir, "background"+e))
}
c.JSON(http.StatusOK, gin.H{"success": true})
}
