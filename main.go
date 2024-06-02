package main

import (
	"fmt"
	"golang.org/x/net/websocket"
	"io"
	"net/http"
  "encoding/json"
)

const maxArenaSession int = 20
var arenas [maxArenaSession][2]*websocket.Conn

func enterArena(ws *websocket.Conn) (int, bool) {
  for i := 0; i < maxArenaSession; i++ {
    count := 0
    for _, conn := range arenas[i] {
      if conn != nil {
        count++
      }
    }
    if count < 2 {
      for j := 0; j < 2; j++ {
        if arenas[i][j] == nil {
          arenas[i][j] = ws
          return i, true
        } 
      }
    }
  }
  fmt.Println("Error: No available arenas")
  return -1, false
}

type WSMessage struct {
  Name string
  Action string
}

type MessageToClient struct {
  Kind string `json:"type"`
  ArenaId int `json:"arenaId"` 
  LenArena int `json:"lenArena"`
  LenGlobal int `json:"lenGlobal"`
  Players [2]string `json:"players"`
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
  arenaId, ok := enterArena(ws); 
  if !ok {
    ws.Write([]byte("Can't join the arena because of an error"))
    return
  }
  s.conns[ws] = true
	s.processDuel(ws, arenaId)
}

func (s *Server) processDuel(ws *websocket.Conn, arenaId int) {
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
    res := fmt.Sprintf("%s has joined the arena (ID: %d)", message.Name, arenaId)
    fmt.Println(res)
    ws.Write([]byte(res))
    mtc := MessageToClient{
      Kind: "metric",
      ArenaId: arenaId,
      LenArena: 2,
      LenGlobal: len(s.conns),
      Players: [2]string{"Ritesh", "Rakesh"},
    }
    data, err := json.Marshal(&mtc)
    ws.Write(data)
    fmt.Println("Number of players in the global arena: ", len(s.conns))
	}
}

func main() {
  const PORT string = ":5000"
	server := NewServer()
	http.Handle("/ws", websocket.Handler(server.handleWS))
  fmt.Println("Listening on ws://localhost" + PORT)
	http.ListenAndServe(PORT, nil)
}
