const chat = {
    messages: []
  };
  
  const addMessage = (message) => {
    chat.messages.push(message);
    if (chat.messages.length > 100) { // Limit the chat history
      chat.messages.shift();
    }
  };
  
  module.exports = {
    chat,
    addMessage
  };
  