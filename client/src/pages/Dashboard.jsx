import { useState } from 'react';
import '../styles/Dashboard.css';
import Button from '../components/Button';
import editIcon from '/edit.svg';
import deleteIcon from '/delete.svg';
import waterIcon from '/water.svg';
import sunIcon from '/sun.svg';

export default function Dashboard() {
    const [activeTab, setActiveTab] = useState('collection');
    const [showModal, setShowModal] = useState(false);
    const [plants, setPlants] = useState([
        {
            id: 1,
            name: 'Monstera Deliciosa',
            species: 'Monstera deliciosa',
            watering: 'Weekly',
            light: 'Bright, indirect light',
            notes: 'Loves humidity. Mist leaves occasionally.',
            added: '1/14/2025',
        },
        {
            id: 2,
            name: 'Snake Plant',
            species: 'Sansevieria trifasciata',
            watering: 'Every 2–3 weeks',
            light: 'Low to bright light',
            notes: 'Very drought tolerant. Great air purifier.',
            added: '1/31/2025',
        },
    ]);

    const [newPlant, setNewPlant] = useState({ nickname: '', species: '' });
    const [chatMessages, setChatMessages] = useState([
        {
            sender: 'bot',
            text: 'Hi! I’m your AI Botanist 🌱. How can I help today?',
        },
    ]);
    const [userInput, setUserInput] = useState('');

    const handleAddPlant = async () => {
        if (!newPlant.species) return;

        // Placeholder for Perenual API
        const plant = {
            id: plants.length + 1,
            name: newPlant.nickname || newPlant.species,
            species: newPlant.species,
            watering: 'Every 1–2 weeks',
            light: 'Bright, indirect light',
            notes: 'Newly added plant from API data.',
            added: new Date().toLocaleDateString(),
        };
        setPlants([...plants, plant]);
        setShowModal(false);
        setNewPlant({ nickname: '', species: '' });
    };

    const handleChatSubmit = async (e) => {
        e.preventDefault();
        if (!userInput.trim()) return;
        const newUserMsg = { sender: 'user', text: userInput };
        setChatMessages((prev) => [...prev, newUserMsg]);
        setUserInput('');

        // Placeholder for OpenAI API
        const botReply = {
            sender: 'bot',
            text: 'Yellow leaves could be from overwatering or low light. Try adjusting your watering schedule!',
        };
        setChatMessages((prev) => [...prev, botReply]);
    };

    return (
        <div className="dashboard">
            <header className="dashboard--header">
                <h2>PlantPal Care Assistant</h2>
                <p>
                    Manage your plant collection and chat with your AI botanist
                    for sustainable care advice
                </p>

                <div className="dashboard--tabs">
                    <button
                        className={`tab-btn ${
                            activeTab === 'collection' ? 'active' : ''
                        }`}
                        onClick={() => setActiveTab('collection')}>
                        My Collection
                    </button>
                    <button
                        className={`tab-btn ${
                            activeTab === 'ai' ? 'active' : ''
                        }`}
                        onClick={() => setActiveTab('ai')}>
                        AI Botanist
                    </button>
                </div>
            </header>

            {/* My Collection View */}
            {activeTab === 'collection' && (
                <section className="plant-collection">
                    <div className="plant-collection-header">
                        <h3>Your Plants ({plants.length})</h3>
                        <Button
                            className="add-plant-btn"
                            onClick={() => setShowModal(true)}>
                            + Add Plant
                        </Button>
                    </div>
                    <p>Manage and track your growing collection</p>

                    <div className="plant-grid">
                        {plants.map((plant) => (
                            <div className="plant-card" key={plant.id}>
                                <div className="plant-header">
                                    <div>
                                        <h4>{plant.name}</h4>
                                        <p className="plant-species">
                                            {plant.species}
                                        </p>
                                    </div>
                                    <div className="plant-actions">
                                        <img src={editIcon} alt="edit icon" />
                                        <img
                                            src={deleteIcon}
                                            alt="delete icon"
                                        />
                                    </div>
                                </div>

                                <div className="plant-details">
                                    <div className="plant-row">
                                        <img src={waterIcon} alt="water icon" />
                                        <div>
                                            <strong>Watering</strong>
                                            <p>{plant.watering}</p>
                                        </div>
                                    </div>
                                    <div className="plant-row">
                                        <img src={sunIcon} alt="sun icon" />
                                        <div>
                                            <strong>Light</strong>
                                            <p>{plant.light}</p>
                                        </div>
                                    </div>
                                    <p className="plant-notes">{plant.notes}</p>
                                    <p className="plant-date">
                                        Added: {plant.added}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {showModal && (
                        <div className="modal-overlay">
                            <div className="modal">
                                <h3>Add a New Plant</h3>
                                <label>Nickname (optional)</label>
                                <input
                                    type="text"
                                    value={newPlant.nickname}
                                    onChange={(e) =>
                                        setNewPlant({
                                            ...newPlant,
                                            nickname: e.target.value,
                                        })
                                    }
                                    placeholder="e.g., Leafy"
                                />
                                <label>Species</label>
                                <input
                                    type="text"
                                    value={newPlant.species}
                                    onChange={(e) =>
                                        setNewPlant({
                                            ...newPlant,
                                            species: e.target.value,
                                        })
                                    }
                                    placeholder="e.g., Ficus lyrata"
                                />
                                <div className="modal-actions">
                                    <button onClick={handleAddPlant}>
                                        Add
                                    </button>
                                    <button
                                        className="cancel"
                                        onClick={() => setShowModal(false)}>
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </section>
            )}

            {/* AI Botanist View */}
            {activeTab === 'ai' && (
                <section className="ai-botanist">
                    <div className="chat-box">
                        {chatMessages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`chat-message ${
                                    msg.sender === 'user' ? 'user' : 'bot'
                                }`}>
                                {msg.text}
                            </div>
                        ))}
                    </div>
                    <form className="chat-input" onSubmit={handleChatSubmit}>
                        <input
                            type="text"
                            placeholder="Ask your AI botanist..."
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                        />
                        <button type="submit">Send</button>
                    </form>
                </section>
            )}
        </div>
    );
}
