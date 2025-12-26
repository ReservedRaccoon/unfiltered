# 🎭 Unfiltered - A Multiplayer Party Game

**Unfiltered** is a real-time multiplayer web game inspired by *Psych!* and *Quiplash*. Players join a room, answer funny or revealing questions about each other, and try to fool their friends into voting for their fake answers.

![Game Status](https://img.shields.io/badge/Status-Active-success)
![Node.js](https://img.shields.io/badge/Node.js-v14+-green)
![Socket.io](https://img.shields.io/badge/Socket.io-Realtime-blue)

## 🎮 How It Works
1.  **Lobby:** Players join a specific Room Code (e.g., "ROOM1").
2.  **The Host:** The first person to join becomes the **Host**. They control the game and click **"Start Game"** when everyone is ready.
3.  **The Question:** A question is picked from the database (e.g., *"If {player} was a dictator, what would be their first law?"*).
4.  **The Answers:** Everyone submits an answer.
    * The **Subject** (the person named in the question) writes the "Truth".
    * **Imposters** write fake answers to fool others.
5.  **The Vote:** All answers are shuffled and shown anonymously. Players vote for what they think is the "Truth".
6.  **Scoring:**
    * **+10 Points** if you find the Real Truth.
    * **+10 Points** if you fool someone with your Fake Answer.

## 🛠 Tech Stack
**Unfiltered** is built with a lightweight, event-driven architecture.

* **Runtime Environment:** Node.js
* **Backend Framework:** Express.js
* **Real-time Engine:** Socket.io (WebSockets)
* **Frontend:** Vanilla JavaScript, HTML5, CSS3
* **Database:** JSON-based local storage (for questions)

## 🚀 Installation & Setup

### Prerequisites
* [Node.js](https://nodejs.org/) installed on your computer.

### Steps
1.  **Clone the Repository**
    ```bash
    git clone [https://github.com/ReservedRaccoon/unfiltered.git](https://github.com/ReservedRaccoon/unfiltered.git)
    cd unfiltered
    ```

2.  **Install Dependencies**
    This installs Express and Socket.io.
    ```bash
    npm install
    ```

3.  **Run the Server**
    ```bash
    node src/server.js
    ```

4.  **Play!**
    Open your browser and go to:
    `http://localhost:3001`

## 📂 Project Structure

```text
unfiltered/
├── node_modules/       # Dependencies (Do not upload to Git)
├── src/
│   ├── client.js       # Frontend logic (Host buttons, socket events)
│   ├── index.html      # Main game UI
│   ├── questions.json  # Database of questions
│   ├── server.js       # Backend logic (Game state, Scoring, Socket.io)
│   └── styles.css      # Game styling
├── .gitignore          # Tells Git to ignore node_modules
├── package.json        # Project settings and dependencies
└── README.md           # This file
