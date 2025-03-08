const express = require("express");
const path = require("path");
const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server);

app.use(express.static(path.join(__dirname, "/public")));

const rooms = {};
io.on("connection", function (socket) {
    socket.on("joinroom", function ({ username, room }) {
        socket.join(room);
        if (!rooms[room]) {
            rooms[room] = {};
        }
        rooms[room][socket.id] = username;

        socket.to(room).emit("update", `${username} joined the conversation`);
    });

    socket.on("exitroom", function ({ username, room }) {
        socket.leave(room);
        socket.to(room).emit("update", `${username} left the conversation`);
        if (rooms[room]) {
            delete rooms[room][socket.id];
            if (Object.keys(rooms[room]).length === 0) {
                delete rooms[room];
            }
        }
    });

    socket.on("chat", function ({ username, text, time, room }) {
        socket.to(room).emit("chat", { username, text, time });
    });

    socket.on("getRoomDetails", function ({ room }) {
        if (rooms[room]) {
            let members = Object.values(rooms[room]);
            io.to(room).emit("roomDetails", { members });
        }
    });

    socket.on("disconnect", function () {
        for (const room in rooms) {
            if (rooms[room][socket.id]) {
                const username = rooms[room][socket.id];
                delete rooms[room][socket.id];
                socket.to(room).emit("update", `${username} left the conversation`);
                if (Object.keys(rooms[room]).length === 0) {
                    delete rooms[room];
                }
            }
        }
    });
});

server.listen(process.env.PORT || 3000);