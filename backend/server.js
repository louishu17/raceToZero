const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

app.use(cors());

const server = http.createServer(app);
const db = require("./database");

const games = {};

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.get("/solutions", (req, res) => {
  db.getAllSolutions((err, rows) => {
    if (err) {
      res.status(500).send("Error fetching solutions from database");
    } else {
      res.json(rows);
    }
  });
});

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.on("joinGame", ({ gameId, username }) => {
    console.log(`Player ${username} (${socket.id}) joined room ${gameId}`);
    if (!games[gameId]) {
      games[gameId] = {
        players: {},
        turns: 0,
        playerChoices: {},
      };
    }
    games[gameId].players[socket.id] = username;
    if (!games[gameId].playerChoices[username]) {
      games[gameId].playerChoices[username] = [];
    }

    if (!games[gameId].currentTurn) {
      games[gameId].currentTurn = username;
    }

    socket.join(gameId);
    io.to(gameId).emit("gameState", games[gameId]);
  });

  socket.on("selectSolution", ({ gameId, username, solution }) => {
    const game = games[gameId];
    if (game) {
      const currentPlayer = username;
      // Update game state based on the selected solution
      // get the emission reduction from solutions database
      console.log(currentPlayer, game.currentTurn);
      if (game.currentTurn === currentPlayer) {
        db.getEmissionReduction(solution, (err, emissionReduction) => {
          if (err) {
            console.log(err);
            return;
          }
          if (emissionReduction !== null) {
            game.totalEmissions -= emissionReduction;
            if (!game.playerChoices[username]) {
              game.playerChoices[username] = [];
            }
            game.playerChoices[username].push({ solution, emissionReduction });
            console.log(game.playerChoices[username]);
            game.turns++;
          } else {
            console.log(`Solution ${solution} not found in the database.`);
          }
          const playerIds = Object.keys(game.players);
          const currentPlayerIndex = playerIds.indexOf(socket.id);
          const nextPlayerIndex = (currentPlayerIndex + 1) % playerIds.length;
          game.currentTurn = game.players[playerIds[nextPlayerIndex]];
          io.to(gameId).emit("gameState", game);

          if (game.turns >= 20) {
            // 10 turns per player
            // Calculate and announce the winner
            const winner = Object.keys(game.playerChoices).reduce((a, b) =>
              game.playerChoices[a].reduce(
                (a, b) => a + b.emissionReduction,
                0
              ) >
              game.playerChoices[b].reduce((a, b) => a + b.emissionReduction, 0)
                ? a
                : b
            );
            io.to(gameId).emit("winner", winner);
          }
        });
      } else {
        // It's not this player's turn
        socket.emit("notYourTurn", { message: "It's not your turn" });
      }
    }
  });
  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
    // Handle disconnection - e.g., remove player from game, notify others, etc.
  });
});

const PORT = 3001;
// server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
server.listen(PORT, "0.0.0.0");
