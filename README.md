# PlantPal

PlantPal is a fullstack web application that empowers users to **grow and sustain healthier plants** using data, AI, and sustainability insights.

Built during the **Road to Hire Hackathon Powered by Red Ventures**, this project demonstrates how technology can promote **responsible AI**, **environmental impact**, and **engineering excellence**.

## Live Demo

Check out the live site here: **[PlantPal Live Demo](plant-pal-production.up.railway.app)**

---

## Technologies Used

### **Frontend**

-   **React.js (Vite)** – Component-based architecture for fast, modular UI development
-   **JavaScript (ES6+)** – Dynamic rendering and event handling
-   **CSS3** – Reusable styles, responsive layouts, and smooth animations
-   **React Router** – Client-side routing for seamless navigation

### **Backend**

-   **Node.js + Express**
-   **MySQL Database**
-   **OpenAI API** (AI Assistant)
-   **Perenual API** (Plant Data)

### Hosting

-   **Railway** (Fullstack Deployment)

---

## Features

### 1. Personalized Plant Stats (OpenAI API)

Each user receives tailored stats based on their plant collection, including Estimated CO₂ Removal, Sustainability Tips, and Suggested Next Plant - all powered by the **OpenAI API**.

### 2. User’s Plant Collection (Perenual API)

A dynamic dashboard that lets users:

-   **Add**, **Edit**, and **Delete** plants
-   View plant data (light level, watering schedule, toxicity, etc.)

### 3. AI Botanist (OpenAI API)

An interactive **AI chatbot** that helps users:

-   Diagnose plant problems
-   Learn about sustainable gardening
-   Get context-aware tips like:
    -   “Why are my pothos leaves turning yellow?”
    -   “How can I reuse old soil safely?”
    -   “What native plants thrive with low water use?”

---

## Project Structure

```
ecommerce-v2/
│
├── client/             # React frontend
│ ├── public/           # Images and icons
│ ├── src/
│ │ ├── assets/         # Product images
│ │ ├── components/     # Reusable UI components
│ │ ├── contexts/       # User authentication
│ │ ├── pages/          # Homepage, Products, Contact, etc.
│ │ ├── styles/         # CSS modules
│ │ └── App.jsx         # Main app component
│ │ └── main.jsx        # Entry point for React code
│ └── index.html        # Entry point for entire application
│ └── package.json
│
├── server/             # Node.js backend
│ ├── db.js             # Database connection
│ ├── server.js/        # Backend logic
│ └── package.json
│
└── .gitignore
└── package.json
└── README.md
```

---

## Setup & Installation

### 1. Clone the Repository

```bash
git clone git@github.com:khangvu0/plant-pal.git
cd plant-pal
```

### 2. Install Dependencies

```bash

cd client
npm install
cd ../server
npm install
```

### 3. Setup Environment Variables

Create a `.env` file in your server folder:

```
DB_HOST=your_host
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=plantpal
OPENAI_API_KEY=your_openai_key
PERENUAL_API_KEY=your_perenual_key
```

### 4. Run the App

your_postgres_connection_string

```bash
# In two separate terminals
npm run dev         # inside client/
npm start           # inside server/
```

---

## Screenshots

![Homepage](/client/src/assets/screenshot1.png)
![Dashboard Page](/client/src/assets/screenshot2.png)
![Register and Login Pages](/client/src/assets/screenshot3.png)
