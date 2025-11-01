import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/Dashboard.css';
import Button from '../components/Button';
import editIcon from '/edit.svg';
import deleteIcon from '/delete.svg';
import waterIcon from '/water.svg';
import sunIcon from '/sun.svg';

export default function Dashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    
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

    const [newPlant, setNewPlant] = useState({ nickname: '' });
    const SUGGEST_DEBOUNCE_MS = 2000; // Delaying the API call by 2 seconds
    const [nameQuery, setNameQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [selectedSuggestion, setSelectedSuggestion] = useState(null);
    const [isSuggestLoading, setIsSuggestLoading] = useState(false);
    const [suggestError, setSuggestError] = useState(null);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isAddingPlant, setIsAddingPlant] = useState(false);

    const [chatHistory, setChatHistory] = useState([
        {
            role: 'assistant',
            content: 'Hi! I’m Plant Pal🌱. How can I help today?',
        },
    ]);
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [chatError, setChatError] = useState(null);
    const [userInput, setUserInput] = useState('');
    useEffect(() => {
        const query = nameQuery.trim();

        if (selectedSuggestion) {
            setIsSuggestLoading(false);
            setShowSuggestions(false);
            return;
        }
        if (query.length < 2) {
            setSuggestions([]);
            setShowSuggestions(false);
            setIsSuggestLoading(false);
            setSuggestError(null);
            return;
        }

        let isActive = true;
        const controller = new AbortController();
        setIsSuggestLoading(true);
        setSuggestError(null);

        const timer = setTimeout(async () => {
            try {
                const response = await fetch(
                    `/api/plants/suggest?q=${encodeURIComponent(query)}`,
                    { signal: controller.signal }
                );
                if (!response.ok) {
                    throw new Error(`Suggest failed (${response.status})`);
                }
                const { suggestions: data } = await response.json();
                if (!isActive) return;
                setSuggestions(Array.isArray(data) ? data : []);
                setShowSuggestions(true);
            } catch (error) {
                if (error.name === 'AbortError') return;
                console.error('Plant suggest error:', error);
                if (isActive) {
                    setSuggestError('Unable to search plants right now.');
                    setSuggestions([]);
                    setShowSuggestions(false);
                }
            } finally {
                if (isActive) {
                    setIsSuggestLoading(false);
                }
            }
        }, SUGGEST_DEBOUNCE_MS);

        return () => {
            isActive = false;
            controller.abort();
            clearTimeout(timer);
        };
    }, [nameQuery, selectedSuggestion]);

    const handleSuggestionSelect = (suggestion) => {
        setSelectedSuggestion(suggestion);
        setNameQuery(suggestion.common_name || suggestion.scientific_name || '');
        setShowSuggestions(false);
        setSuggestions([]);
        setSuggestError(null);
    };

    // For Perenual API
    const handleAddPlant = async () => {
        if (!selectedSuggestion) {
            setSuggestError('Please choose a plant from the list.');
            return;
        }

        setIsAddingPlant(true);
        try {
            const doFetchDetails = async () => {
                const resp = await fetch(`/api/plants/details/${selectedSuggestion.id}`);
                return resp;
            };

            let response = await doFetchDetails();
            if (response.status === 429) {
                await new Promise((r) => setTimeout(r, 2500));
                response = await doFetchDetails();
            }

            if (!response.ok) {
                if (response.status === 404) {
                    setSuggestError('Details not available for this plant. Please select another.');
                    return;
                }
                if (response.status === 429) {
                    setSuggestError('Rate limited. Please wait a moment and try again.');
                    return;
                }
                throw new Error(`Plant details failed (${response.status})`);
            }

            const { plant: details } = await response.json();
            const plant = {
                id: details.id,
                name:
                    newPlant.nickname ||
                    details.common_name ||
                    details.scientific_name ||
                    nameQuery,
                species: details.scientific_name || details.common_name || '',
                watering: details.watering_frequency || 'Water as needed',
                light: details.sunlight || 'Information not available',
                notes: details.description || '',
                imageUrl: details.image,
                added: new Date().toLocaleDateString(),
            };

            // Save to local state (your existing logic)
            setPlants((prev) => [...prev, plant]);
            
            // Also save to database if user is authenticated
            if (user) {
                try {
                    const plantData = {
                        name: plant.name,
                        species: plant.species,
                        watering_frequency: plant.watering,
                        sunlight: plant.light,
                        notes: plant.notes,
                        image_url: plant.imageUrl
                    };
                    await axios.post('/api/user/plants', plantData);
                } catch (dbError) {
                    console.warn('Failed to save to database:', dbError);
                    // Plant still shows in UI even if database save fails
                }
            }
            
            setShowModal(false);
            setNewPlant({ nickname: '' });
            setNameQuery('');
            setSuggestions([]);
            setSelectedSuggestion(null);
            setSuggestError(null);
        } catch (error) {
            console.error('Add plant failed:', error);
            alert(error.message || 'Unable to add plant right now.');
        } finally {
            setIsAddingPlant(false);
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

            if (!response.ok)
                throw new Error(`AI request failed (${response.status})`);
            const { history: serverHistory } = await response.json();
            setChatHistory(serverHistory ?? nextHistory);
        } catch (error) {
            console.error('AI Botanist error:', error);
            setChatHistory([
                ...nextHistory,
                {
                    role: 'assistant',
                    content:
                        'Sorry, my greenhouse is offline. :( Please try again soon.',
                },
            ]);
            setChatError('The AI botanist is temporarily unavailable.');
        } finally {
            setIsChatLoading(false);
        }
    };

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!user) {
            navigate('/login');
        }
    }, [user, navigate]);

    // Load user's plants from database
    useEffect(() => {
        if (user) {
            loadUserPlants();
        }
    }, [user]);

    const loadUserPlants = async () => {
        try {
            const response = await axios.get('/api/user/plants');
            if (response.data.success && response.data.plants.length > 0) {
                // If user has plants in database, show those instead of samples
                const dbPlants = response.data.plants.map(plant => ({
                    ...plant,
                    watering: plant.watering_frequency || 'Water as needed',
                    light: plant.sunlight || 'Information not available',
                    added: plant.created_at ? new Date(plant.created_at).toLocaleDateString() : 'Recently added'
                }));
                setPlants(dbPlants);
            }
            // If no plants in database, keep the sample plants
        } catch (error) {
            console.error('Failed to load plants:', error);
            // On error, keep the sample plants
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="dashboard">
            <header className="dashboard--header">
                <h2 className="dashboard--header_title">
                    PlantPal Care Assistant
                </h2>
                <p className="dashboard--header_description">
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
                        <h3 className="collection-title">
                            Your Plants ({plants.length})
                        </h3>
                        <Button
                            className="add-plant-btn"
                            onClick={() => {
                                setShowModal(true);
                                setNameQuery('');
                                setSuggestions([]);
                                setSelectedSuggestion(null);
                                setSuggestError(null);
                            }}>
                            + Add Plant
                        </Button>
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
                                        <h4 className="plant-name">
                                            {plant.name}
                                        </h4>
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
                                            <strong>Watering Interval</strong>
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
                                    disabled={isAddingPlant}
                                />
                                <label>Plant name</label>
                                <div className="plant-suggest">
                                    <input
                                        type="text"
                                        value={nameQuery}
                                        onChange={(e) => {
                                            setNameQuery(e.target.value);
                                            setSelectedSuggestion(null);
                                            setSuggestError(null);
                                        }}
                                        onFocus={() => {
                                            if (suggestions.length > 0 && !selectedSuggestion) {
                                                setShowSuggestions(true);
                                            }
                                        }}
                                        onBlur={() => {
                                            setTimeout(
                                                () => setShowSuggestions(false),
                                                120
                                            );
                                        }}
                                        placeholder="Start typing to search..."
                                        disabled={isAddingPlant}
                                    />
                                    {isSuggestLoading && (
                                        <p className="plant-suggest__status">
                                            Searching…
                                        </p>
                                    )}
                                    {!isSuggestLoading &&
                                        showSuggestions &&
                                        suggestions.length === 0 &&
                                        nameQuery.trim().length >= 2 && (
                                            <p className="plant-suggest__status">
                                                No matches found.
                                            </p>
                                        )}
                                    {suggestError && (
                                        <p className="plant-suggest__error">
                                            {suggestError}
                                        </p>
                                    )}
                                    {showSuggestions &&
                                        suggestions.length > 0 && (
                                            <ul className="plant-suggest__list">
                                                {suggestions.map((suggestion, index) => {
                                                    const primary =
                                                        suggestion.common_name ||
                                                        suggestion.scientific_name ||
                                                        'Unnamed plant';
                                                    const secondary =
                                                        suggestion.scientific_name &&
                                                        suggestion.scientific_name !==
                                                            suggestion.common_name
                                                            ? ` — ${suggestion.scientific_name}`
                                                            : '';
                                                    return (
                                                        <li
                                                            key={suggestion.id}
                                                            className={`plant-suggest__item`}
                                                            onMouseDown={(event) => {
                                                                event.preventDefault();
                                                                handleSuggestionSelect(suggestion);
                                                            }}>
                                                            <span className="plant-suggest__primary">
                                                                {primary}
                                                                {secondary}
                                                            </span>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        )}
                                </div>
                                <div className="custom-modal-actions">
                                    <button
                                        type="button"
                                        onClick={handleAddPlant}
                                        disabled={
                                            isAddingPlant || !selectedSuggestion
                                        }>
                                        {isAddingPlant ? 'Adding…' : 'Add'}
                                    </button>
                                    <button
                                        type="button"
                                        className="cancel"
                                        onClick={() => {
                                            setShowModal(false);
                                            setSelectedSuggestion(null);
                                            setSuggestions([]);
                                            setNameQuery('');
                                            setSuggestError(null);
                                        }}>
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
                            <div
                                key={index}
                                className={`chat-message ${
                                    turn.role === 'user' ? 'user' : 'bot'
                                }`}>
                                {turn.content}
                            </div>
                        ))}
                        {isChatLoading && (
                            <div className="chat-message bot typing">
                                PlantPal is thinking…
                            </div>
                        )}
                    </div>
                    {chatError && <p className="chat-error">{chatError}</p>}
                    <form className="chat-input" onSubmit={handleChatSubmit}>
                        <input
                            type="text"
                            placeholder="Ask your AI botanist..."
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            disabled={isChatLoading}
                            className="browser-default"
                        />
                        <button type="submit" disabled={isChatLoading}>
                            Send
                        </button>
                    </form>
                </section>
            )}
        </div>
    );
}