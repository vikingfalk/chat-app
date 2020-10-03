// Connect to socket
const socket = io();


// Get DOM elements
const messageContainer = document.getElementById('message-container');
const messageForm = document.getElementById('send-container');
const messageInput = document.getElementById('message-input');
const roomUsers = document.getElementById('room-users');


// Initialize new user
socket.emit('new-user', roomName, userName);


// Event listeners
messageForm.addEventListener('submit', sendChatMessage);


// Listen for socket events
socket.on('chat-message', appendMessage);
socket.on('user-connected', handleUserConnected);
socket.on('user-disconnected', handleUserDisconnected);


// Function declarations
function sendChatMessage(event) {
    event.preventDefault();
    const message = messageInput.value;
    socket.emit('send-chat-message', roomName, message);
    messageInput.value = '';
}

function appendMessage(message, classes) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    classes.forEach(cls => messageElement.classList.add(cls));

    messageElement.innerHTML = message;

    messageContainer.append(messageElement);

    messageContainer.scrollTop = messageContainer.scrollHeight;
}

function handleUserConnected(message, name) {
    appendMessage(message, ['recieved', 'server-msg']);
    
    const userElement = document.createElement('li');
    userElement.classList.add('user');
    userElement.setAttribute('id', name);

    userElement.innerHTML = `
    <span class="material-icons">person</span>
    ${name}`;

    roomUsers.append(userElement);
}

function handleUserDisconnected(message, name) {
    appendMessage(message, ['recieved', 'server-msg']);

    roomUsers.removeChild(roomUsers.children.namedItem(name));
}