// D&D Campaign Companion App
class CampaignApp {
    constructor() {
        this.currentCampaign = null;
        this.currentView = 'dashboard';
        this.editingEntity = null;
        this.data = {
            campaigns: [],
            characters: [],
            locations: [],
            items: [],
            relationships: [],
            notes: []
        };
        this.relationshipTypes = [
            {"id": "ally", "label": "Ally", "color": "#4CAF50"},
            {"id": "enemy", "label": "Enemy", "color": "#F44336"}, 
            {"id": "neutral", "label": "Neutral", "color": "#9E9E9E"},
            {"id": "mentor", "label": "Mentor", "color": "#2196F3"},
            {"id": "rival", "label": "Rival", "color": "#FF9800"},
            {"id": "family", "label": "Family", "color": "#E91E63"},
            {"id": "located-in", "label": "Located In", "color": "#607D8B"},
            {"id": "contains", "label": "Contains", "color": "#795548"},
            {"id": "owns", "label": "Owns", "color": "#9C27B0"}
        ];
        this.init();
    }

    init() {
        this.loadData();
        this.setupEventListeners();
        this.initializeApp();
    }

    loadData() {
        const savedData = localStorage.getItem('dndCampaignData');
        if (savedData) {
            this.data = JSON.parse(savedData);
        } else {
            // Initialize with sample data
            this.data = {
                campaigns: [
                    {
                        "id": "campaign_1",
                        "name": "The Lost Mines of Phandelver",
                        "description": "A classic starter adventure in the Sword Coast",
                        "created": "2024-01-15",
                        "lastModified": "2024-07-06"
                    }
                ],
                characters: [
                    {
                        "id": "char_1",
                        "name": "Gundren Rockseeker",
                        "type": "NPC",
                        "race": "Dwarf",
                        "class": "Merchant",
                        "location": "location_1",
                        "description": "A dwarven merchant seeking to reclaim his family's lost mine",
                        "relationships": ["char_2", "location_1"],
                        "tags": ["important", "quest-giver", "dwarf"],
                        "campaignId": "campaign_1"
                    },
                    {
                        "id": "char_2", 
                        "name": "Sildar Hallwinter",
                        "type": "NPC",
                        "race": "Human",
                        "class": "Noble/Fighter",
                        "location": "location_1",
                        "description": "A human lord and agent of the Lords' Alliance",
                        "relationships": ["char_1"],
                        "tags": ["alliance", "noble", "fighter"],
                        "campaignId": "campaign_1"
                    }
                ],
                locations: [
                    {
                        "id": "location_1",
                        "name": "Neverwinter", 
                        "type": "City",
                        "parent": "location_2",
                        "description": "A large port city on the Sword Coast",
                        "characters": ["char_1", "char_2"],
                        "children": ["location_3"],
                        "tags": ["major-city", "port", "sword-coast"],
                        "campaignId": "campaign_1"
                    },
                    {
                        "id": "location_2",
                        "name": "Sword Coast",
                        "type": "Region", 
                        "parent": null,
                        "description": "The western coast of Faerûn",
                        "children": ["location_1"],
                        "tags": ["region", "faerun"],
                        "campaignId": "campaign_1"
                    },
                    {
                        "id": "location_3",
                        "name": "The Moonstone Mask",
                        "type": "Tavern",
                        "parent": "location_1", 
                        "description": "A popular tavern in Neverwinter's dock district",
                        "tags": ["tavern", "dock-district"],
                        "campaignId": "campaign_1"
                    }
                ],
                items: [
                    {
                        "id": "item_1",
                        "name": "Gundren's Map",
                        "type": "Map",
                        "description": "A hand-drawn map showing the location of the Lost Mine of Phandelver",
                        "owner": "char_1",
                        "location": "location_1",
                        "magical": false,
                        "tags": ["important", "quest-item", "map"],
                        "campaignId": "campaign_1"
                    }
                ],
                relationships: [
                    {
                        "id": "rel_1",
                        "from": "char_1",
                        "to": "char_2", 
                        "type": "ally",
                        "strength": 8,
                        "description": "Business partners and friends",
                        "campaignId": "campaign_1"
                    },
                    {
                        "id": "rel_2",
                        "from": "char_1",
                        "to": "location_1",
                        "type": "located-in",
                        "strength": 10,
                        "description": "Currently residing in Neverwinter",
                        "campaignId": "campaign_1"
                    }
                ],
                notes: [
                    {
                        "id": "note_1",
                        "title": "Session 1 - The Journey Begins",
                        "content": "The party met Gundren Rockseeker in Neverwinter. He hired them to escort a wagon to Phandalin while he and Sildar Hallwinter rode ahead. The wagon contained mining supplies and unknown cargo.",
                        "timestamp": "2024-07-01T19:00:00Z",
                        "tags": ["session-notes", "phandalin", "beginning"],
                        "linkedEntities": ["char_1", "char_2", "location_1"],
                        "campaignId": "campaign_1"
                    }
                ]
            };
            this.saveData();
        }
    }

    saveData() {
        localStorage.setItem('dndCampaignData', JSON.stringify(this.data));
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchView(item.dataset.view);
            });
        });

        // Mobile menu toggle
        const menuToggle = document.getElementById('menu-toggle');
        const sidebar = document.getElementById('sidebar');
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });

        // Close sidebar when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768 && !sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
                sidebar.classList.remove('open');
            }
        });

        // Theme toggle
        document.getElementById('theme-toggle').addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-color-scheme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-color-scheme', newTheme);
            document.getElementById('theme-toggle').textContent = newTheme === 'dark' ? '☀️' : '🌙';
            localStorage.setItem('theme', newTheme);
        });

        // Load saved theme
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            document.documentElement.setAttribute('data-color-scheme', savedTheme);
            document.getElementById('theme-toggle').textContent = savedTheme === 'dark' ? '☀️' : '🌙';
        }

        // Back to campaigns
        document.getElementById('back-to-campaigns').addEventListener('click', () => {
            this.showCampaignSelection();
        });

        // Form submissions
        this.setupFormHandlers();

        // Search functionality
        this.setupSearchHandlers();
    }

    setupFormHandlers() {
        // New campaign form
        document.getElementById('new-campaign-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const campaign = {
                id: 'campaign_' + Date.now(),
                name: formData.get('name'),
                description: formData.get('description'),
                created: new Date().toISOString().split('T')[0],
                lastModified: new Date().toISOString().split('T')[0]
            };
            this.data.campaigns.push(campaign);
            this.saveData();
            this.closeModal();
            this.renderCampaignList();
        });

        // Character form
        document.getElementById('character-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const character = {
                id: this.editingEntity ? this.editingEntity.id : 'char_' + Date.now(),
                name: formData.get('name'),
                type: formData.get('type'),
                race: formData.get('race'),
                class: formData.get('class'),
                location: formData.get('location'),
                description: formData.get('description'),
                tags: formData.get('tags') ? formData.get('tags').split(',').map(t => t.trim()) : [],
                relationships: this.editingEntity ? this.editingEntity.relationships : [],
                campaignId: this.currentCampaign
            };

            if (this.editingEntity) {
                const index = this.data.characters.findIndex(c => c.id === this.editingEntity.id);
                this.data.characters[index] = character;
            } else {
                this.data.characters.push(character);
            }

            this.saveData();
            this.closeModal();
            this.renderCharacters();
            this.updateDashboard();
        });

        // Location form
        document.getElementById('location-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const location = {
                id: this.editingEntity ? this.editingEntity.id : 'location_' + Date.now(),
                name: formData.get('name'),
                type: formData.get('type'),
                parent: formData.get('parent') || null,
                description: formData.get('description'),
                tags: formData.get('tags') ? formData.get('tags').split(',').map(t => t.trim()) : [],
                children: this.editingEntity ? this.editingEntity.children : [],
                characters: this.editingEntity ? this.editingEntity.characters : [],
                campaignId: this.currentCampaign
            };

            if (this.editingEntity) {
                const index = this.data.locations.findIndex(l => l.id === this.editingEntity.id);
                this.data.locations[index] = location;
            } else {
                this.data.locations.push(location);
                // Update parent's children array
                if (location.parent) {
                    const parent = this.data.locations.find(l => l.id === location.parent);
                    if (parent && !parent.children.includes(location.id)) {
                        parent.children.push(location.id);
                    }
                }
            }

            this.saveData();
            this.closeModal();
            this.renderLocations();
            this.updateDashboard();
        });

        // Item form
        document.getElementById('item-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const item = {
                id: this.editingEntity ? this.editingEntity.id : 'item_' + Date.now(),
                name: formData.get('name'),
                type: formData.get('type'),
                owner: formData.get('owner') || null,
                location: formData.get('location') || null,
                description: formData.get('description'),
                magical: formData.get('magical') === 'on',
                tags: formData.get('tags') ? formData.get('tags').split(',').map(t => t.trim()) : [],
                campaignId: this.currentCampaign
            };

            if (this.editingEntity) {
                const index = this.data.items.findIndex(i => i.id === this.editingEntity.id);
                this.data.items[index] = item;
            } else {
                this.data.items.push(item);
            }

            this.saveData();
            this.closeModal();
            this.renderItems();
            this.updateDashboard();
        });

        // Note form
        document.getElementById('note-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const note = {
                id: this.editingEntity ? this.editingEntity.id : 'note_' + Date.now(),
                title: formData.get('title'),
                content: formData.get('content'),
                timestamp: this.editingEntity ? this.editingEntity.timestamp : new Date().toISOString(),
                tags: formData.get('tags') ? formData.get('tags').split(',').map(t => t.trim()) : [],
                linkedEntities: this.extractLinkedEntities(formData.get('content')),
                campaignId: this.currentCampaign
            };

            if (this.editingEntity) {
                const index = this.data.notes.findIndex(n => n.id === this.editingEntity.id);
                this.data.notes[index] = note;
            } else {
                this.data.notes.push(note);
            }

            this.saveData();
            this.closeModal();
            this.renderNotes();
            this.updateDashboard();
        });

        // Relationship form
        document.getElementById('relationship-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const relationship = {
                id: this.editingEntity ? this.editingEntity.id : 'rel_' + Date.now(),
                from: formData.get('from'),
                to: formData.get('to'),
                type: formData.get('type'),
                strength: parseInt(formData.get('strength')),
                description: formData.get('description'),
                campaignId: this.currentCampaign
            };

            if (this.editingEntity) {
                const index = this.data.relationships.findIndex(r => r.id === this.editingEntity.id);
                this.data.relationships[index] = relationship;
            } else {
                this.data.relationships.push(relationship);
            }

            this.saveData();
            this.closeModal();
            this.renderRelationships();
            this.updateDashboard();
        });
    }

    setupSearchHandlers() {
        // Characters search
        document.getElementById('characters-search').addEventListener('input', (e) => {
            this.renderCharacters(e.target.value);
        });

        document.getElementById('character-filter').addEventListener('change', (e) => {
            const searchTerm = document.getElementById('characters-search').value;
            this.renderCharacters(searchTerm, e.target.value);
        });

        // Locations search
        document.getElementById('locations-search').addEventListener('input', (e) => {
            this.renderLocations(e.target.value);
        });

        // Items search
        document.getElementById('items-search').addEventListener('input', (e) => {
            this.renderItems(e.target.value);
        });

        // Notes search
        document.getElementById('notes-search').addEventListener('input', (e) => {
            this.renderNotes(e.target.value);
        });

        // Relationship filter
        document.getElementById('relationship-filter').addEventListener('change', (e) => {
            this.renderRelationships(e.target.value);
        });
    }

    initializeApp() {
        this.showCampaignSelection();
    }

    showCampaignSelection() {
        document.getElementById('campaign-selection').classList.add('active');
        document.getElementById('main-app').classList.add('hidden');
        this.renderCampaignList();
    }

    renderCampaignList() {
        const campaignList = document.getElementById('campaign-list');
        campaignList.innerHTML = '';

        this.data.campaigns.forEach(campaign => {
            const campaignCard = document.createElement('div');
            campaignCard.className = 'campaign-card';
            campaignCard.onclick = () => this.selectCampaign(campaign.id);
            
            campaignCard.innerHTML = `
                <div class="campaign-card-content">
                    <h3>${campaign.name}</h3>
                    <p>${campaign.description}</p>
                    <div class="campaign-meta">
                        <span>Created: ${campaign.created}</span>
                        <span>Last Modified: ${campaign.lastModified}</span>
                    </div>
                </div>
            `;
            
            campaignList.appendChild(campaignCard);
        });
    }

    selectCampaign(campaignId) {
        this.currentCampaign = campaignId;
        const campaign = this.data.campaigns.find(c => c.id === campaignId);
        document.getElementById('current-campaign-name').textContent = campaign.name;
        
        document.getElementById('campaign-selection').classList.remove('active');
        document.getElementById('main-app').classList.remove('hidden');
        
        this.switchView('dashboard');
    }

    switchView(viewName) {
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-view="${viewName}"]`).classList.add('active');

        // Hide all views
        document.querySelectorAll('.content-view').forEach(view => {
            view.classList.add('hidden');
        });

        // Show selected view
        document.getElementById(`${viewName}-view`).classList.remove('hidden');
        this.currentView = viewName;

        // Close mobile sidebar
        if (window.innerWidth <= 768) {
            document.getElementById('sidebar').classList.remove('open');
        }

        // Render content for the view
        switch (viewName) {
            case 'dashboard':
                this.updateDashboard();
                break;
            case 'characters':
                this.renderCharacters();
                break;
            case 'locations':
                this.renderLocations();
                break;
            case 'items':
                this.renderItems();
                break;
            case 'relationships':
                this.renderRelationships();
                break;
            case 'notes':
                this.renderNotes();
                break;
        }
    }

    updateDashboard() {
        this.renderRecentActivity();
        this.renderQuickStats();
    }

    renderRecentActivity() {
        const recentActivity = document.getElementById('recent-activity');
        const activities = [];

        // Get recent notes
        const recentNotes = this.data.notes
            .filter(n => n.campaignId === this.currentCampaign)
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 3);

        recentNotes.forEach(note => {
            activities.push({
                type: 'note',
                title: `Note added: ${note.title}`,
                time: this.formatRelativeTime(note.timestamp),
                icon: '📝'
            });
        });

        // Get recent characters (last 3 created)
        const recentCharacters = this.data.characters
            .filter(c => c.campaignId === this.currentCampaign)
            .slice(-3);

        recentCharacters.forEach(character => {
            activities.push({
                type: 'character',
                title: `Character added: ${character.name}`,
                time: 'Recently',
                icon: '👥'
            });
        });

        // Sort and take top 5
        activities.sort((a, b) => b.time - a.time);
        const topActivities = activities.slice(0, 5);

        recentActivity.innerHTML = topActivities.length > 0 ? 
            topActivities.map(activity => `
                <div class="activity-item">
                    <div class="activity-icon">${activity.icon}</div>
                    <div class="activity-content">
                        <div class="activity-title">${activity.title}</div>
                        <div class="activity-time">${activity.time}</div>
                    </div>
                </div>
            `).join('') : '<p>No recent activity</p>';
    }

    renderQuickStats() {
        const quickStats = document.getElementById('quick-stats');
        const stats = {
            'Characters': this.data.characters.filter(c => c.campaignId === this.currentCampaign).length,
            'Locations': this.data.locations.filter(l => l.campaignId === this.currentCampaign).length,
            'Items': this.data.items.filter(i => i.campaignId === this.currentCampaign).length,
            'Notes': this.data.notes.filter(n => n.campaignId === this.currentCampaign).length,
            'Relationships': this.data.relationships.filter(r => r.campaignId === this.currentCampaign).length
        };

        quickStats.innerHTML = Object.entries(stats).map(([key, value]) => `
            <div class="stat-item">
                <span>${key}</span>
                <span class="stat-value">${value}</span>
            </div>
        `).join('');
    }

    renderCharacters(searchTerm = '', filterType = '') {
        const charactersGrid = document.getElementById('characters-grid');
        let characters = this.data.characters.filter(c => c.campaignId === this.currentCampaign);

        // Apply search filter
        if (searchTerm) {
            characters = characters.filter(c => 
                c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        // Apply type filter
        if (filterType) {
            characters = characters.filter(c => c.type === filterType);
        }

        if (characters.length === 0) {
            charactersGrid.innerHTML = `
                <div class="empty-state">
                    <h3>No characters found</h3>
                    <p>Create your first character to get started!</p>
                    <button class="btn btn--primary" onclick="showCharacterModal()">Add Character</button>
                </div>
            `;
            return;
        }

        charactersGrid.innerHTML = characters.map(character => {
            const location = this.data.locations.find(l => l.id === character.location);
            return `
                <div class="entity-card" onclick="editCharacter('${character.id}')">
                    <div class="entity-header">
                        <h3 class="entity-name">${character.name}</h3>
                        <span class="entity-type">${character.type}</span>
                    </div>
                    <div class="entity-details">
                        ${character.race ? `<div class="entity-detail">
                            <span class="entity-detail-label">Race:</span>
                            <span class="entity-detail-value">${character.race}</span>
                        </div>` : ''}
                        ${character.class ? `<div class="entity-detail">
                            <span class="entity-detail-label">Class:</span>
                            <span class="entity-detail-value">${character.class}</span>
                        </div>` : ''}
                        ${location ? `<div class="entity-detail">
                            <span class="entity-detail-label">Location:</span>
                            <span class="entity-detail-value">${location.name}</span>
                        </div>` : ''}
                    </div>
                    ${character.description ? `<div class="entity-description">${character.description}</div>` : ''}
                    ${character.tags.length > 0 ? `<div class="entity-tags">
                        ${character.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>` : ''}
                    <div class="entity-actions">
                        <button class="btn btn--secondary" onclick="event.stopPropagation(); editCharacter('${character.id}')">Edit</button>
                        <button class="btn btn--secondary" onclick="event.stopPropagation(); deleteCharacter('${character.id}')">Delete</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderLocations(searchTerm = '') {
        const locationsTree = document.getElementById('locations-tree');
        let locations = this.data.locations.filter(l => l.campaignId === this.currentCampaign);

        // Apply search filter
        if (searchTerm) {
            locations = locations.filter(l => 
                l.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                l.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                l.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        if (locations.length === 0) {
            locationsTree.innerHTML = `
                <div class="empty-state">
                    <h3>No locations found</h3>
                    <p>Create your first location to get started!</p>
                    <button class="btn btn--primary" onclick="showLocationModal()">Add Location</button>
                </div>
            `;
            return;
        }

        // Build tree structure
        const rootLocations = locations.filter(l => !l.parent);
        locationsTree.innerHTML = rootLocations.map(location => this.renderLocationTree(location, locations)).join('');
    }

    renderLocationTree(location, allLocations) {
        const children = allLocations.filter(l => l.parent === location.id);
        const hasChildren = children.length > 0;

        return `
            <div class="location-tree-item">
                <div class="location-item" onclick="editLocation('${location.id}')">
                    <button class="location-toggle" onclick="event.stopPropagation(); toggleLocationChildren('${location.id}')" ${!hasChildren ? 'style="visibility: hidden;"' : ''}>
                        <span class="toggle-icon">▶</span>
                    </button>
                    <div class="location-icon">${this.getLocationIcon(location.type)}</div>
                    <span class="location-name">${location.name}</span>
                    <span class="location-type">${location.type}</span>
                </div>
                ${hasChildren ? `<div class="location-children" id="children-${location.id}">
                    ${children.map(child => this.renderLocationTree(child, allLocations)).join('')}
                </div>` : ''}
            </div>
        `;
    }

    getLocationIcon(type) {
        // Using text-based icons instead of image URLs to avoid broken images
        const iconMap = {
            'Continent': 'C',
            'Region': 'R',
            'City': 'C',
            'Town': 'T',
            'Village': 'V',
            'Building': 'B',
            'Room': 'R',
            'Dungeon': 'D',
            'Tavern': 'T'
        };
        return iconMap[type] || 'L';
    }

    renderItems(searchTerm = '') {
        const itemsGrid = document.getElementById('items-grid');
        let items = this.data.items.filter(i => i.campaignId === this.currentCampaign);

        // Apply search filter
        if (searchTerm) {
            items = items.filter(i => 
                i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                i.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                i.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        if (items.length === 0) {
            itemsGrid.innerHTML = `
                <div class="empty-state">
                    <h3>No items found</h3>
                    <p>Create your first item to get started!</p>
                    <button class="btn btn--primary" onclick="showItemModal()">Add Item</button>
                </div>
            `;
            return;
        }

        itemsGrid.innerHTML = items.map(item => {
            const owner = this.data.characters.find(c => c.id === item.owner);
            const location = this.data.locations.find(l => l.id === item.location);
            
            return `
                <div class="entity-card" onclick="editItem('${item.id}')">
                    <div class="entity-header">
                        <h3 class="entity-name">${item.name} ${item.magical ? '✨' : ''}</h3>
                        <span class="entity-type">${item.type}</span>
                    </div>
                    <div class="entity-details">
                        ${owner ? `<div class="entity-detail">
                            <span class="entity-detail-label">Owner:</span>
                            <span class="entity-detail-value">${owner.name}</span>
                        </div>` : ''}
                        ${location ? `<div class="entity-detail">
                            <span class="entity-detail-label">Location:</span>
                            <span class="entity-detail-value">${location.name}</span>
                        </div>` : ''}
                    </div>
                    ${item.description ? `<div class="entity-description">${item.description}</div>` : ''}
                    ${item.tags.length > 0 ? `<div class="entity-tags">
                        ${item.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>` : ''}
                    <div class="entity-actions">
                        <button class="btn btn--secondary" onclick="event.stopPropagation(); editItem('${item.id}')">Edit</button>
                        <button class="btn btn--secondary" onclick="event.stopPropagation(); deleteItem('${item.id}')">Delete</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderNotes(searchTerm = '') {
        const notesList = document.getElementById('notes-list');
        let notes = this.data.notes.filter(n => n.campaignId === this.currentCampaign);

        // Apply search filter
        if (searchTerm) {
            notes = notes.filter(n => 
                n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                n.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                n.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        // Sort by timestamp (newest first)
        notes.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        if (notes.length === 0) {
            notesList.innerHTML = `
                <div class="empty-state">
                    <h3>No notes found</h3>
                    <p>Create your first note to get started!</p>
                    <button class="btn btn--primary" onclick="showNoteModal()">Add Note</button>
                </div>
            `;
            return;
        }

        notesList.innerHTML = notes.map(note => `
            <div class="note-card" onclick="editNote('${note.id}')">
                <div class="note-header">
                    <h3 class="note-title">${note.title}</h3>
                    <span class="note-timestamp">${this.formatDate(note.timestamp)}</span>
                </div>
                <div class="note-content">${note.content}</div>
                ${note.linkedEntities && note.linkedEntities.length > 0 ? `<div class="note-links">
                    ${note.linkedEntities.map(entityId => {
                        const entity = this.getEntityById(entityId);
                        return entity ? `<a href="#" class="entity-link" onclick="event.stopPropagation(); viewEntity('${entityId}')">${entity.name}</a>` : '';
                    }).join('')}
                </div>` : ''}
                ${note.tags.length > 0 ? `<div class="entity-tags">
                    ${note.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>` : ''}
            </div>
        `).join('');
    }

    renderRelationships(filterType = '') {
        const relationshipNetwork = document.getElementById('relationship-network');
        let relationships = this.data.relationships.filter(r => r.campaignId === this.currentCampaign);

        // Apply filter
        if (filterType) {
            relationships = relationships.filter(r => r.type === filterType);
        }

        if (relationships.length === 0) {
            relationshipNetwork.innerHTML = `
                <div class="empty-state">
                    <h3>No relationships found</h3>
                    <p>Create your first relationship to get started!</p>
                    <button class="btn btn--primary" onclick="showRelationshipModal()">Add Relationship</button>
                </div>
            `;
            return;
        }

        // Create a simple network visualization
        relationshipNetwork.innerHTML = `
            <div class="network-legend">
                <div class="legend-item">
                    <div class="legend-color" style="background-color: #2196F3;"></div>
                    <span>Characters</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background-color: #4CAF50;"></div>
                    <span>Locations</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background-color: #FF9800;"></div>
                    <span>Items</span>
                </div>
            </div>
            <div style="padding: 20px;">
                <h4>Relationship Network</h4>
                ${relationships.map(rel => {
                    const fromEntity = this.getEntityById(rel.from);
                    const toEntity = this.getEntityById(rel.to);
                    const relType = this.relationshipTypes.find(t => t.id === rel.type);
                    
                    return `
                        <div class="relationship-item">
                            <div class="relationship-item-header">
                                <div class="relationship-item-content">
                                    <strong>${fromEntity ? fromEntity.name : 'Unknown'}</strong>
                                    <span style="color: ${relType ? relType.color : '#666'}; margin: 0 8px;">${relType ? relType.label : rel.type}</span>
                                    <strong>${toEntity ? toEntity.name : 'Unknown'}</strong>
                                </div>
                                <div class="relationship-item-actions">
                                    <span class="relationship-strength">Strength: ${rel.strength}/10</span>
                                    <button class="btn btn--secondary" onclick="editRelationship('${rel.id}')">Edit</button>
                                    <button class="btn btn--secondary" onclick="deleteRelationship('${rel.id}')">Delete</button>
                                </div>
                            </div>
                            ${rel.description ? `<p style="margin: 8px 0 0 0; color: var(--color-text-secondary);">${rel.description}</p>` : ''}
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    // Modal functions
    showNewCampaignModal() {
        this.editingEntity = null;
        document.getElementById('modal-overlay').classList.remove('hidden');
        document.getElementById('new-campaign-modal').style.display = 'block';
    }

    showCharacterModal(characterId = null) {
        this.populateLocationSelects();
        this.editingEntity = characterId ? this.data.characters.find(c => c.id === characterId) : null;
        
        const modal = document.getElementById('character-modal');
        const form = document.getElementById('character-form');
        
        document.getElementById('character-modal-title').textContent = this.editingEntity ? 'Edit Character' : 'Add Character';
        
        if (this.editingEntity) {
            form.name.value = this.editingEntity.name;
            form.type.value = this.editingEntity.type;
            form.race.value = this.editingEntity.race || '';
            form.class.value = this.editingEntity.class || '';
            form.location.value = this.editingEntity.location || '';
            form.description.value = this.editingEntity.description || '';
            form.tags.value = this.editingEntity.tags.join(', ');
        } else {
            form.reset();
        }
        
        document.getElementById('modal-overlay').classList.remove('hidden');
        modal.style.display = 'block';
    }

    showLocationModal(locationId = null) {
        this.populateLocationParentSelect();
        this.editingEntity = locationId ? this.data.locations.find(l => l.id === locationId) : null;
        
        const modal = document.getElementById('location-modal');
        const form = document.getElementById('location-form');
        
        document.getElementById('location-modal-title').textContent = this.editingEntity ? 'Edit Location' : 'Add Location';
        
        if (this.editingEntity) {
            form.name.value = this.editingEntity.name;
            form.type.value = this.editingEntity.type;
            form.parent.value = this.editingEntity.parent || '';
            form.description.value = this.editingEntity.description || '';
            form.tags.value = this.editingEntity.tags.join(', ');
        } else {
            form.reset();
        }
        
        document.getElementById('modal-overlay').classList.remove('hidden');
        modal.style.display = 'block';
    }

    showItemModal(itemId = null) {
        this.populateCharacterSelects();
        this.populateLocationSelects();
        this.editingEntity = itemId ? this.data.items.find(i => i.id === itemId) : null;
        
        const modal = document.getElementById('item-modal');
        const form = document.getElementById('item-form');
        
        document.getElementById('item-modal-title').textContent = this.editingEntity ? 'Edit Item' : 'Add Item';
        
        if (this.editingEntity) {
            form.name.value = this.editingEntity.name;
            form.type.value = this.editingEntity.type;
            form.owner.value = this.editingEntity.owner || '';
            form.location.value = this.editingEntity.location || '';
            form.description.value = this.editingEntity.description || '';
            form.magical.checked = this.editingEntity.magical || false;
            form.tags.value = this.editingEntity.tags.join(', ');
        } else {
            form.reset();
        }
        
        document.getElementById('modal-overlay').classList.remove('hidden');
        modal.style.display = 'block';
    }

    showNoteModal(noteId = null) {
        this.editingEntity = noteId ? this.data.notes.find(n => n.id === noteId) : null;
        
        const modal = document.getElementById('note-modal');
        const form = document.getElementById('note-form');
        
        document.getElementById('note-modal-title').textContent = this.editingEntity ? 'Edit Note' : 'Add Note';
        
        if (this.editingEntity) {
            form.title.value = this.editingEntity.title;
            form.content.value = this.editingEntity.content;
            form.tags.value = this.editingEntity.tags.join(', ');
        } else {
            form.reset();
        }
        
        document.getElementById('modal-overlay').classList.remove('hidden');
        modal.style.display = 'block';
    }

    showRelationshipModal(relationshipId = null) {
        this.populateRelationshipSelects();
        this.editingEntity = relationshipId ? this.data.relationships.find(r => r.id === relationshipId) : null;
        
        const modal = document.getElementById('relationship-modal');
        const form = document.getElementById('relationship-form');
        
        if (this.editingEntity) {
            form.from.value = this.editingEntity.from;
            form.to.value = this.editingEntity.to;
            form.type.value = this.editingEntity.type;
            form.strength.value = this.editingEntity.strength;
            form.description.value = this.editingEntity.description || '';
        } else {
            form.reset();
        }
        
        document.getElementById('modal-overlay').classList.remove('hidden');
        modal.style.display = 'block';
    }

    showQuickAddModal() {
        document.getElementById('modal-overlay').classList.remove('hidden');
        document.getElementById('quick-add-modal').style.display = 'block';
    }

    closeModal() {
        document.getElementById('modal-overlay').classList.add('hidden');
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
        this.editingEntity = null;
    }

    // Helper functions
    populateLocationSelects() {
        const selects = ['character-location-select', 'item-location-select'];
        const locations = this.data.locations.filter(l => l.campaignId === this.currentCampaign);
        
        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) {
                select.innerHTML = '<option value="">None</option>' + 
                    locations.map(l => `<option value="${l.id}">${l.name}</option>`).join('');
            }
        });
    }

    populateCharacterSelects() {
        const select = document.getElementById('item-owner-select');
        const characters = this.data.characters.filter(c => c.campaignId === this.currentCampaign);
        
        if (select) {
            select.innerHTML = '<option value="">None</option>' + 
                characters.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
        }
    }

    populateLocationParentSelect() {
        const select = document.getElementById('location-parent-select');
        const locations = this.data.locations.filter(l => l.campaignId === this.currentCampaign);
        
        if (select) {
            select.innerHTML = '<option value="">None (Top Level)</option>' + 
                locations.map(l => `<option value="${l.id}">${l.name}</option>`).join('');
        }
    }

    populateRelationshipSelects() {
        const fromSelect = document.getElementById('relationship-from-select');
        const toSelect = document.getElementById('relationship-to-select');
        const typeSelect = document.getElementById('relationship-type-select');
        
        const allEntities = [
            ...this.data.characters.filter(c => c.campaignId === this.currentCampaign).map(c => ({id: c.id, name: c.name, type: 'Character'})),
            ...this.data.locations.filter(l => l.campaignId === this.currentCampaign).map(l => ({id: l.id, name: l.name, type: 'Location'})),
            ...this.data.items.filter(i => i.campaignId === this.currentCampaign).map(i => ({id: i.id, name: i.name, type: 'Item'}))
        ];
        
        const options = allEntities.map(e => `<option value="${e.id}">${e.name} (${e.type})</option>`).join('');
        
        if (fromSelect) fromSelect.innerHTML = options;
        if (toSelect) toSelect.innerHTML = options;
        if (typeSelect) {
            typeSelect.innerHTML = this.relationshipTypes.map(t => `<option value="${t.id}">${t.label}</option>`).join('');
        }
    }

    getEntityById(id) {
        return this.data.characters.find(c => c.id === id) ||
               this.data.locations.find(l => l.id === id) ||
               this.data.items.find(i => i.id === id);
    }

    extractLinkedEntities(content) {
        const entities = [];
        const allEntities = [
            ...this.data.characters.filter(c => c.campaignId === this.currentCampaign),
            ...this.data.locations.filter(l => l.campaignId === this.currentCampaign),
            ...this.data.items.filter(i => i.campaignId === this.currentCampaign)
        ];
        
        allEntities.forEach(entity => {
            if (content.toLowerCase().includes(entity.name.toLowerCase())) {
                entities.push(entity.id);
            }
        });
        
        return entities;
    }

    formatDate(timestamp) {
        return new Date(timestamp).toLocaleDateString();
    }

    formatRelativeTime(timestamp) {
        const now = new Date();
        const time = new Date(timestamp);
        const diff = now - time;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        if (days === 0) return 'Today';
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days} days ago`;
        if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
        return `${Math.floor(days / 30)} months ago`;
    }

    // Delete functions
    deleteCharacter(id) {
        if (confirm('Are you sure you want to delete this character?')) {
            this.data.characters = this.data.characters.filter(c => c.id !== id);
            this.data.relationships = this.data.relationships.filter(r => r.from !== id && r.to !== id);
            this.saveData();
            this.renderCharacters();
            this.updateDashboard();
        }
    }

    deleteLocation(id) {
        if (confirm('Are you sure you want to delete this location?')) {
            this.data.locations = this.data.locations.filter(l => l.id !== id);
            this.data.relationships = this.data.relationships.filter(r => r.from !== id && r.to !== id);
            this.saveData();
            this.renderLocations();
            this.updateDashboard();
        }
    }

    deleteItem(id) {
        if (confirm('Are you sure you want to delete this item?')) {
            this.data.items = this.data.items.filter(i => i.id !== id);
            this.data.relationships = this.data.relationships.filter(r => r.from !== id && r.to !== id);
            this.saveData();
            this.renderItems();
            this.updateDashboard();
        }
    }

    deleteNote(id) {
        if (confirm('Are you sure you want to delete this note?')) {
            this.data.notes = this.data.notes.filter(n => n.id !== id);
            this.saveData();
            this.renderNotes();
            this.updateDashboard();
        }
    }

    deleteRelationship(id) {
        if (confirm('Are you sure you want to delete this relationship?')) {
            this.data.relationships = this.data.relationships.filter(r => r.id !== id);
            this.saveData();
            this.renderRelationships();
            this.updateDashboard();
        }
    }
}

// Global functions for onclick handlers
function showNewCampaignModal() {
    window.app.showNewCampaignModal();
}

function showCharacterModal() {
    window.app.showCharacterModal();
}

function showLocationModal() {
    window.app.showLocationModal();
}

function showItemModal() {
    window.app.showItemModal();
}

function showNoteModal() {
    window.app.showNoteModal();
}

function showRelationshipModal() {
    window.app.showRelationshipModal();
}

function showQuickAddModal() {
    window.app.showQuickAddModal();
}

function closeModal() {
    window.app.closeModal();
}

function editCharacter(id) {
    window.app.showCharacterModal(id);
}

function editLocation(id) {
    window.app.showLocationModal(id);
}

function editItem(id) {
    window.app.showItemModal(id);
}

function editNote(id) {
    window.app.showNoteModal(id);
}

function editRelationship(id) {
    window.app.showRelationshipModal(id);
}

function deleteCharacter(id) {
    window.app.deleteCharacter(id);
}

function deleteLocation(id) {
    window.app.deleteLocation(id);
}

function deleteItem(id) {
    window.app.deleteItem(id);
}

function deleteNote(id) {
    window.app.deleteNote(id);
}

function deleteRelationship(id) {
    window.app.deleteRelationship(id);
}

function toggleLocationChildren(id) {
    const children = document.getElementById(`children-${id}`);
    const toggle = document.querySelector(`[onclick*="toggleLocationChildren('${id}')"] .toggle-icon`);
    
    if (children.style.display === 'none') {
        children.style.display = 'block';
        toggle.textContent = '▼';
    } else {
        children.style.display = 'none';
        toggle.textContent = '▶';
    }
}

function viewEntity(id) {
    // This would navigate to the entity's detail view
    const entity = window.app.getEntityById(id);
    if (entity) {
        // Determine entity type and navigate to appropriate view
        if (window.app.data.characters.find(c => c.id === id)) {
            window.app.switchView('characters');
        } else if (window.app.data.locations.find(l => l.id === id)) {
            window.app.switchView('locations');
        } else if (window.app.data.items.find(i => i.id === id)) {
            window.app.switchView('items');
        }
    }
}

// Initialize the app
window.addEventListener('DOMContentLoaded', () => {
    window.app = new CampaignApp();
});

// Close modal on overlay click
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
        closeModal();
    }
});

// Close modal on escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeModal();
    }
});