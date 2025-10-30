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

    const [chatHistory, setChatHistory] = useState([
    { role: 'assistant', content: 'Hi! I’m Plant Pal🌱. How can I help today?' },
    ]);
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [chatError, setChatError] = useState(null);
    const [userInput, setUserInput] = useState('');
    // For Perenual API
    const handleAddPlant = async () => {
        if (!newPlant.species.trim()) return;

        try {
            const response = await fetch(
                `/api/plants?q=${encodeURIComponent(newPlant.species.trim())}`
            );
            if (!response.ok) {
                throw new Error(`Plant search failed (${response.status})`);
            }

            const { data } = await response.json();
            const match = Array.isArray(data) ? data[0] : null;
            if (!match) throw new Error('No results found for that species');

            const plant = {
                id: match.id,
                name: newPlant.nickname || match.common_name || newPlant.species,
                species: match.scientific_name || newPlant.species,
                watering: match.watering_frequency || 'Water as needed',
                light: match.sunlight || 'Information not available',
                notes: match.description || '',
                imageUrl: match.image,
                added: new Date().toLocaleDateString(),
            };

            setPlants((prev) => [...prev, plant]);
            setShowModal(false);
            setNewPlant({ nickname: '', species: '' });
        } catch (error) {
            console.error('Add plant failed:', error);
            alert(error.message || 'Unable to add plant right now.');
        }
    };
    // For OpenAI API
    const handleChatSubmit = async (event) => {
        event.preventDefault();
        const prompt = userInput.trim();
        if (!prompt || isChatLoading) return;

        const nextHistory = [...chatHistory, { role: 'user', content: prompt }];
        setChatHistory(nextHistory);
        setUserInput('');
        setChatError(null);
        setIsChatLoading(true);

    try {   
        const response = await fetch('/api/ai/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ history: chatHistory, prompt }),
        });

        if (!response.ok) throw new Error(`AI request failed (${response.status})`);
        const { history: serverHistory } = await response.json();
        setChatHistory(serverHistory ?? nextHistory);
    } catch (error) {
            console.error('AI Botanist error:', error);
            setChatHistory([
            ...nextHistory,
            { role: 'assistant', content: 'Sorry, my greenhouse is offline. :( Please try again soon.' },
        ]);
        setChatError('The AI botanist is temporarily unavailable.');
    } finally {
        setIsChatLoading(false);
    }
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
                        {showModal && (
                        <div className="custom-modal-overlay">
                        <div className="custom-modal">
                        </div>
                        </div>
)}
                    </div>
                    <p>Manage and track your growing collection</p>

                    <div className="plant-grid">
                        {plants.map((plant) => (
                            <div className="plant-card" key={plant.id}>
                                {plant.imageUrl && (
                                    <img
                                        src={plant.imageUrl}
                                        alt={`${plant.name} plant`}
                                        className="plant-photo"
                                    />
                                )}
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
                        <div className="custom-modal-overlay">
                            <div className="custom-modal">
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
                                <div className="custom-modal-actions">
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
                    {chatHistory.map((turn, index) => (
                        <div key={index} className={`chat-message ${turn.role === 'user' ? 'user' : 'bot'}`}>
                        {turn.content}
                        </div>
                    ))}
                    {isChatLoading && <div className="chat-message bot typing">PlantPal is thinking…</div>}
                    </div>
                    {chatError && <p className="chat-error">{chatError}</p>}
                    <form className="chat-input" onSubmit={handleChatSubmit}>
                    <input
                        type="text"
                        placeholder="Ask your AI botanist..."
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        disabled={isChatLoading}
                    />
                    <button type="submit" disabled={isChatLoading}>Send</button>
                    </form>
                </section>
            )}
        </div>
    );
}
