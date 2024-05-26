package main

import (
	"fmt"
	"golang.org/x/net/websocket"
	"io"
	"net/http"
  "encoding/json"
)

type WSMessage struct {
  Action string
  Name string
}

type Server struct {
	conns map[*websocket.Conn]bool
}

func NewServer() *Server {
	return &Server{
		conns: make(map[*websocket.Conn]bool),
	}
}

func (s *Server) handleWS(ws *websocket.Conn) {
	fmt.Println("New connection from", ws.RemoteAddr())
	s.conns[ws] = true
	s.readLoop(ws)
}

func (s *Server) readLoop(ws *websocket.Conn) {
	buf := make([]byte, 1024)
	for {
		n, err := ws.Read(buf)
		if err != nil {
			if err == io.EOF {
				fmt.Println("Connection closed by", ws.RemoteAddr())
				break
			}
			fmt.Println("Read error:", err)
			continue
		}
    var message WSMessage
    err = json.Unmarshal(buf[:n], &message)
    if err != nil {
      fmt.Println(err)
    }
    fmt.Println(message.Name, "has joined the arena.")
	}
}

func main() {
  const PORT string = ":5000"
	server := NewServer()
	http.Handle("/ws", websocket.Handler(server.handleWS))
  fmt.Println("Listening on ws://localhost" + PORT)
	http.ListenAndServe(PORT, nil)
}
