const moment = require('moment');

// Setup server
const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

server.listen(process.env.PORT || 5000);

app.set('views', './views');
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));


const rooms = {};


// Routes
app.get('/', (req, res) => {
    res.render('index', { rooms });
});

app.get('/room', (req, res) => {
    const room = req.query.room;
    const username = req.query.username;

    if(rooms[room] == null) {
        return res.redirect('/');
    }

    res.render('room', { roomName: room, userName: username,
        users: Object.values(rooms[room].users) });
});

app.post('/room', createNewRoom);


// Listen for socket events
io.on('connection', socket => {
    socket.on('new-user', (room, name) => {
        socket.join(room);
        rooms[room].users[socket.id] = name;

        const formattedMsg = formatMessage(`${name} joined the room`, 'ChatBot');
        io.to(room).emit('user-connected', formattedMsg, name);
    });

    socket.on('send-chat-message', (room, message) => {
        const formattedMsg = formatMessage(message, rooms[room].users[socket.id]);
        socket.to(room).broadcast.emit('chat-message', formattedMsg, ['recieved']);
        socket.emit('chat-message', formattedMsg, ['sent']);
    });

    socket.on('disconnect', () => {
        getUserRooms(socket).forEach(room => {
            const name = rooms[room].users[socket.id];
            const formattedMsg = formatMessage(`${name} left the room`, 'ChatBot');
            socket.to(room).broadcast.emit('user-disconnected', formattedMsg, name);
            delete rooms[room].users[socket.id];
        });
    });
});


// Function declarations
function createNewRoom(req, res) {
    const newRoom = req.body.room;

    if(rooms[newRoom] != null) {
        return res.redirect('/');
    }

    rooms[newRoom] = { users: {} };
    res.redirect('/');
}

function getUserRooms(socket) {
    return Object.entries(rooms).reduce((names, [name, room]) => {
        if(room.users[socket.id] != null) names.push(name);
        return names;
    }, []);
}

function formatMessage(message, name) {
    return `<span class="name">${name}</span>
            <span class="time">${moment().format('HH:mm')}</span>
            <p>${message}</p>`;
}