package relay

// 假流式（Fake Stream）：客户端 stream=true 且渠道开启 fake_stream 时，
// 以非流式请求上游，等待期间发送 SSE 保活注释，拿到完整结果后切片成
// chat.completion.chunk 逐段回放。
// 环境变量：FAKE_STREAM_CHUNK_SIZE(默认24) FAKE_STREAM_CHUNK_DELAY_MS(默认8) FAKE_STREAM_PING_SECONDS(默认10)

import (
"bytes"
"net/http"
"strings"
"sync"
"time"

"github.com/QuantumNous/new-api/common"
"github.com/QuantumNous/new-api/logger"
"github.com/QuantumNous/new-api/relay/helper"
"github.com/gin-gonic/gin"
)

const ctxKeyFakeStreamStarted = "fake_stream_sse_started"

var (
fakeStreamChunkSize    = common.GetEnvOrDefault("FAKE_STREAM_CHUNK_SIZE", 24)
fakeStreamChunkDelayMs = common.GetEnvOrDefault("FAKE_STREAM_CHUNK_DELAY_MS", 8)
fakeStreamPingSeconds  = common.GetEnvOrDefault("FAKE_STREAM_PING_SECONDS", 10)
)

type fakeStreamCapture struct {
gin.ResponseWriter
header http.Header
buf    bytes.Buffer
status int
}

func newFakeStreamCapture(w gin.ResponseWriter) *fakeStreamCapture {
return &fakeStreamCapture{ResponseWriter: w, header: http.Header{}, status: http.StatusOK}
}

func (w *fakeStreamCapture) Header() http.Header                { return w.header }
func (w *fakeStreamCapture) WriteHeader(code int)               { w.status = code }
func (w *fakeStreamCapture) WriteHeaderNow()                    {}
func (w *fakeStreamCapture) Write(b []byte) (int, error)        { return w.buf.Write(b) }
func (w *fakeStreamCapture) WriteString(s string) (int, error)  { return w.buf.WriteString(s) }
func (w *fakeStreamCapture) Status() int                        { return w.status }
func (w *fakeStreamCapture) Size() int                          { return w.buf.Len() }
func (w *fakeStreamCapture) Written() bool                      { return w.buf.Len() > 0 }
func (w *fakeStreamCapture) Flush()                             {}

type fakeStreamSession struct {
c        *gin.Context
real     gin.ResponseWriter
mu       sync.Mutex
stopCh   chan struct{}
doneCh   chan struct{}
stopOnce sync.Once
}

func IsFakeStreamSSEStarted(c *gin.Context) bool { return c.GetBool(ctxKeyFakeStreamStarted) }

func startFakeStreamSession(c *gin.Context) *fakeStreamSession {
s := &fakeStreamSession{c: c, real: c.Writer, stopCh: make(chan struct{}), doneCh: make(chan struct{})}
go s.pingLoop()
return s
}

func (s *fakeStreamSession) ensureHeaders() {
if IsFakeStreamSSEStarted(s.c) {
return
}
h := s.real.Header()
h.Del("Content-Length")
h.Set("Content-Type", "text/event-stream")
h.Set("Cache-Control", "no-cache")
h.Set("Connection", "keep-alive")
h.Set("X-Accel-Buffering", "no")
h.Set("X-Fake-Stream", "1")
s.real.WriteHeader(http.StatusOK)
s.c.Set(ctxKeyFakeStreamStarted, true)
}

func (s *fakeStreamSession) pingLoop() {
defer close(s.doneCh)
if fakeStreamPingSeconds <= 0 {
<-s.stopCh
return
}
ticker := time.NewTicker(time.Duration(fakeStreamPingSeconds) * time.Second)
defer ticker.Stop()
for {
select {
case <-s.stopCh:
return
case <-s.c.Request.Context().Done():
<-s.stopCh
return
case <-ticker.C:
s.mu.Lock()
s.ensureHeaders()
_, err := s.real.Write([]byte(": PING\n\n"))
if err == nil {
s.real.Flush()
}
s.mu.Unlock()
}
}
}

func (s *fakeStreamSession) stop() {
s.stopOnce.Do(func() { close(s.stopCh) })
<-s.doneCh
}

func (s *fakeStreamSession) writeEvent(data string) error {
s.mu.Lock()
defer s.mu.Unlock()
s.ensureHeaders()
if _, err := s.real.Write([]byte("data: " + data + "\n\n")); err != nil {
return err
}
s.real.Flush()
return nil
}

func splitRunes(s string, size int) []string {
if s == "" {
return nil
}
if size <= 0 {
return []string{s}
}
r := []rune(s)
out := make([]string, 0, len(r)/size+1)
for i := 0; i < len(r); i += size {
end := i + size
if end > len(r) {
end = len(r)
}
out = append(out, string(r[i:end]))
}
return out
}

func (s *fakeStreamSession) replay(body []byte, contentType string, includeUsage bool, thinkingToContent bool) {
if strings.HasPrefix(strings.ToLower(contentType), "text/event-stream") || bytes.HasPrefix(bytes.TrimSpace(body), []byte("data:")) {
s.mu.Lock()
s.ensureHeaders()
_, _ = s.real.Write(body)
s.real.Flush()
s.mu.Unlock()
return
}
var resp map[string]any
if err := common.Unmarshal(body, &resp); err != nil {
logger.LogError(s.c, "fake stream: parse upstream body failed: "+err.Error())
_ = s.writeEvent(string(body))
_ = s.writeEvent("[DONE]")
return
}
id, _ := resp["id"].(string)
if id == "" {
id = helper.GetResponseID(s.c)
}
model, _ := resp["model"].(string)
created := resp["created"]
if created == nil {
created = time.Now().Unix()
}
sysFp := resp["system_fingerprint"]
delay := time.Duration(fakeStreamChunkDelayMs) * time.Millisecond
ok := true
emit := func(choices []any, usage any) {
if !ok {
return
}
chunk := map[string]any{"id": id, "object": "chat.completion.chunk", "created": created, "model": model, "choices": choices}
if sysFp != nil {
chunk["system_fingerprint"] = sysFp
}
if usage != nil {
chunk["usage"] = usage
}
data, err := common.Marshal(chunk)
if err != nil || s.writeEvent(string(data)) != nil {
ok = false
}
}
sleep := func() {
if delay > 0 && ok {
time.Sleep(delay)
}
}
delta := func(index any, d map[string]any, finish any) []any {
return []any{map[string]any{"index": index, "delta": d, "logprobs": nil, "finish_reason": finish}}
}
choices, _ := resp["choices"].([]any)
for i, raw := range choices {
choice, _ := raw.(map[string]any)
if choice == nil {
continue
}
index := choice["index"]
if index == nil {
index = i
}
msg, _ := choice["message"].(map[string]any)
if msg == nil {
msg = map[string]any{}
}
role, _ := msg["role"].(string)
if role == "" {
role = "assistant"
}
emit(delta(index, map[string]any{"role": role, "content": ""}, nil), nil)
reasoning, _ := msg["reasoning_content"].(string)
if reasoning == "" {
reasoning, _ = msg["reasoning"].(string)
}
if reasoning != "" {
if thinkingToContent {
for j, p := range splitRunes(reasoning, fakeStreamChunkSize) {
if j == 0 {
p = "<think>\n" + p
}
emit(delta(index, map[string]any{"content": p}, nil), nil)
sleep()
}
emit(delta(index, map[string]any{"content": "\n</think>\n\n"}, nil), nil)
} else {
for _, p := range splitRunes(reasoning, fakeStreamChunkSize) {
emit(delta(index, map[string]any{"reasoning_content": p}, nil), nil)
sleep()
}
}
}
switch content := msg["content"].(type) {
case string:
for _, p := range splitRunes(content, fakeStreamChunkSize) {
emit(delta(index, map[string]any{"content": p}, nil), nil)
sleep()
}
case nil:
default:
emit(delta(index, map[string]any{"content": content}, nil), nil)
}
for _, key := range []string{"refusal", "annotations", "images", "audio"} {
if v, exists := msg[key]; exists && v != nil && v != "" {
emit(delta(index, map[string]any{key: v}, nil), nil)
}
}
if tcs, isArr := msg["tool_calls"].([]any); isArr {
for k, rawTc := range tcs {
tc, _ := rawTc.(map[string]any)
if tc == nil {
continue
}
item := map[string]any{"index": k}
for key, v := range tc {
if key != "index" {
item[key] = v
}
}
emit(delta(index, map[string]any{"tool_calls": []any{item}}, nil), nil)
}
}
finish := choice["finish_reason"]
if finish == nil {
finish = "stop"
}
emit(delta(index, map[string]any{}, finish), nil)
}
if includeUsage {
if usage, exists := resp["usage"]; exists && usage != nil {
emit([]any{}, usage)
}
}
if ok {
_ = s.writeEvent("[DONE]")
}
}

// WriteFakeStreamError 在 SSE 已开始后以事件形式输出错误。
func WriteFakeStreamError(c *gin.Context, payload any) {
data, err := common.Marshal(payload)
if err != nil {
return
}
_, _ = c.Writer.Write([]byte("data: " + string(data) + "\n\ndata: [DONE]\n\n"))
c.Writer.Flush()
}
