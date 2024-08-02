// chat.js

class Chat {
  constructor(io) {
    this.io = io;
    this.messages = [];
  }

  updateChat() {
    this.io.to('mainGame').emit('chatUpdate', this.messages);
  }

  addMessage(message) {
    this.messages.push(message);
    if (this.messages.length > 100) { // Limit the chat history
      this.messages.shift();
    }
    console.log(message.text);
  }

  send(message) {
    this.addMessage(message)
    this.updateChat();
  }

  addJoinMessage(user) {
    const joinMessage = {
      text: `${user.name || user.email} has joined the game.`,
      user: null, // Indicate that this is a system message
    };
    this.addMessage(joinMessage);
    this.updateChat();
  }

  addLeaveMessage(user) {
    const leaveMessage = {
      text: `${user.name || user.email} has left the game.`,
      user: null, // Indicate that this is a system message
    };
    this.addMessage(leaveMessage);
    this.updateChat();
  }

  sendMessage(socket, msg) {
    const message = {
      text: msg,
      user: {
        id: socket.user.uid,
        email: socket.user.email,
        displayName: socket.user.name || socket.user.email,
        image: socket.user.picture,
      },
      timestamp: new Date().toLocaleTimeString(),
    };
    this.addMessage(message);
    this.updateChat();
  }
}

module.exports = Chat;
