package main

import (
	"fmt"
	"golang.org/x/net/websocket"
	"io"
	"net/http"
  "encoding/json"
)

type Player struct {
  conn *websocket.Conn
  username string
  score int
}

type IMessage struct {
  Kind string `json:"type"`
  Username string `json:"username"`
  Score int `json:"score"`
}

const maxArenaSession int = 20
var arenas [maxArenaSession][2]Player

func enterArena(ws *websocket.Conn, imessage *IMessage) (int, bool) {
  for i := 0; i < maxArenaSession; i++ {
    count := 0
    for _, player := range arenas[i] {
      if player.conn != nil {
        count++
      }
    }
    if count < 2 {
      for j := 0; j < 2; j++ {
        if arenas[i][j].conn == nil {
          arenas[i][j].conn = ws
          arenas[i][j].username = imessage.Username
          arenas[i][j].score = imessage.Score
          return i, true
        } 
      }
    }
  }
  fmt.Println("Error: No available arenas")
  return -1, false
}

type MessageToClient struct {
  Kind string `json:"type"`
  ArenaId int `json:"arenaId"` 
  LenGlobal int `json:"lenGlobal"`
  Players [2]string `json:"players"`
  Message string `json:"message"`
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
	s.processNewConn(ws)
}

func (s *Server) broadcastMessage(data []byte, arenaId int) {
  conns := [2]*websocket.Conn{arenas[arenaId][0].conn, arenas[arenaId][1].conn}
  for i := 0; i < len(conns); i++ {
    if conns[i] != nil {
      conns[i].Write(data)
    }
  }
}

func (s *Server) processNewConn(ws *websocket.Conn) {
  // Read incoming messages
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
    var imessage IMessage
    err = json.Unmarshal(buf[:n], &imessage)
    if err != nil {
      fmt.Println(err)
    }

    // Enter to Arena
    var arenaId int
    if imessage.Kind == "new conn" {
      var res string
      arenaId, ok := enterArena(ws, &imessage)
      if !ok {
        res = fmt.Sprintf("Can't join the arena due to some error!")
      } else {
        res = fmt.Sprintf("%s has join the arena (ID: %d)", imessage.Username, arenaId)
        s.conns[ws] = true
      }
      message := MessageToClient{
        Kind: "message",
        Message: res,
      }
      data, _ := json.Marshal(&message)
      ws.Write(data)
    }

    // Broadcast common metrics
    metric := MessageToClient{
      Kind: "metric",
      ArenaId: arenaId,
      LenGlobal: len(s.conns),
      Players: [2]string{
        arenas[arenaId][0].username,
        arenas[arenaId][1].username,
      },
    }
    data, err := json.Marshal(&metric)
    s.broadcastMessage(data, arenaId)
	}
}

func main() {
  const PORT string = ":5000"
	server := NewServer()
	http.Handle("/ws", websocket.Handler(server.handleWS))
  fmt.Println("Listening on ws://localhost" + PORT)
	http.ListenAndServe(PORT, nil)
}
