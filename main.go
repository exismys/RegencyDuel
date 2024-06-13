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
  pos [2]float32
}

type IMessage struct {
  Kind string `json:"type"`
  Username string `json:"username"`
  Score int `json:"score"`
  ArenaId int `json:"arenaId"`
  Players [2]string `json:"players"`
  Scores [2]int
  PlayerOnePos [2]float32 `json:"playerOnePos"`
  PlayerTwoPos [2]float32 `json:"playerTwoPos"`
}

type MessageToClient struct {
  Kind string `json:"type"`
  Message string `json:"message"`
  ArenaId int `json:"arenaId"` 
  LenGlobal int `json:"lenGlobal"`
  Players [2]string `json:"players"`
  Scores [2]int `json:"scores"`
  PlayerOnePos [2]float32 `json:"playerOnePos"`
  PlayerTwoPos [2]float32 `json:"playerTwoPos"`
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
          if j == 0 {
            arenas[i][j].pos = imessage.PlayerOnePos
          } else {
            arenas[i][j].pos = imessage.PlayerTwoPos
          }
          return i, true
        } 
      }
    }
  }
  fmt.Println("Error: No available arenas")
  return -1, false
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

    // Process in case of a new connection
    // Enter to Arena
    var arenaId int
    var ok bool
    if imessage.Kind == "new conn" {
      var res string
      arenaId, ok = enterArena(ws, &imessage)
      if !ok {
        res = fmt.Sprintf("Can't join the arena due to some error!")
      } else {
        res = fmt.Sprintf("%s has join the arena (ID: %d)", imessage.Username, arenaId)
        s.conns[ws] = true
      }

      // Type: message
      message := MessageToClient{
        Kind: "message",
        Message: res,
      }
      data, _ := json.Marshal(&message)
      ws.Write(data)

      // Type: surround
      arena := arenas[arenaId]
      surround := MessageToClient{
        Kind: "surround",
        ArenaId: arenaId,
        Players: [2]string{
          arena[0].username,
          arena[1].username,
        },
        LenGlobal: len(s.conns),
      }
      data, _ = json.Marshal(&surround)
      s.broadcastMessage(data, arenaId)
    }

    // Process when not a new connection
    if imessage.Kind == "metric" {
      // Update player metric
      arena := arenas[imessage.ArenaId]
      arena[0].score = imessage.Scores[0]
      arena[1].score = imessage.Scores[1]
      arena[0].pos = imessage.PlayerOnePos
      arena[1].pos = imessage.PlayerTwoPos

      // Broadcast metric
      metric := MessageToClient{
        Kind: "metric",
        Scores: [2]int{
          arena[0].score,
          arena[1].score,
        },
        PlayerOnePos: arena[0].pos,
        PlayerTwoPos: arena[1].pos,
      }
      data, _ := json.Marshal(&metric)
      s.broadcastMessage(data, arenaId)
    }

    // Broadcast common metrics
    // arena := arenas[arenaId]
    // metric := MessageToClient{
    //   Kind: "metric",
    //   ArenaId: arenaId,
    //   LenGlobal: len(s.conns),
    //   Players: [2]string{
    //     arena[0].username,
    //     arena[1].username,
    //   },
    //   Scores: [2]int{
    //     arena[0].score,
    //     arena[1].score,
    //   },
    //   PlayerOnePos: arena[0].pos,
    //   PlayerTwoPos: arena[1].pos,
    // }
    // data, err := json.Marshal(&metric)
    // s.broadcastMessage(data, arenaId)
	}
}

func main() {
  const PORT string = ":5000"
	server := NewServer()
	http.Handle("/ws", websocket.Handler(server.handleWS))
  fmt.Println("Listening on ws://localhost" + PORT)
	http.ListenAndServe(PORT, nil)
}
