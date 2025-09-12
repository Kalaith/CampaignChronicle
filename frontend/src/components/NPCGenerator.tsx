import { useState } from 'react';
import type { Character } from '../types';
import { Modal } from './Modal';

interface NPCGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (npc: Omit<Character, 'id'>) => void;
  campaignId: string;
}

interface NPCTemplate {
  race: string;
  possibleClasses: string[];
  personalityTraits: string[];
  backgrounds: string[];
  motivations: string[];
  quirks: string[];
}

const raceTemplates: { [key: string]: NPCTemplate } = {
  Human: {
    race: 'Human',
    possibleClasses: ['Fighter', 'Wizard', 'Rogue', 'Cleric', 'Ranger', 'Bard', 'Paladin', 'Barbarian', 'Monk', 'Sorcerer', 'Warlock', 'Druid'],
    personalityTraits: ['Ambitious', 'Curious', 'Generous', 'Stubborn', 'Loyal', 'Skeptical', 'Cheerful', 'Serious', 'Brave', 'Cautious'],
    backgrounds: ['Noble', 'Merchant', 'Soldier', 'Scholar', 'Artisan', 'Farmer', 'Criminal', 'Entertainer', 'Hermit', 'Sailor'],
    motivations: ['Wealth and power', 'Knowledge and wisdom', 'Family honor', 'Personal freedom', 'Justice and order', 'Adventure and glory', 'Love and companionship', 'Revenge', 'Peace and safety', 'Recognition'],
    quirks: ['Always carries a lucky coin', 'Speaks in riddles', 'Collects interesting rocks', 'Hums while working', 'Never removes their hat', 'Afraid of heights', 'Excellent memory for faces', 'Terrible at names', 'Always hungry', 'Superstitious about omens']
  },
  Elf: {
    race: 'Elf',
    possibleClasses: ['Wizard', 'Ranger', 'Rogue', 'Bard', 'Druid', 'Sorcerer', 'Fighter', 'Cleric'],
    personalityTraits: ['Elegant', 'Patient', 'Arrogant', 'Wise', 'Mysterious', 'Graceful', 'Aloof', 'Artistic', 'Perfectionist', 'Contemplative'],
    backgrounds: ['Noble', 'Scholar', 'Artisan', 'Hermit', 'Entertainer', 'Outlander', 'Acolyte'],
    motivations: ['Preserving ancient knowledge', 'Protecting nature', 'Artistic perfection', 'Long-term planning', 'Cultural superiority', 'Magical mastery', 'Ancient grudges', 'Eternal beauty', 'Harmony with nature', 'Ancestral duty'],
    quirks: ['Speaks in an archaic dialect', 'Cannot resist correcting others', 'Meditates at dawn', 'Writes poetry about everything', 'Fascinated by mortal customs', 'Never hurries', 'Collects rare books', 'Dislikes iron tools', 'Has prophetic dreams', 'Ages wine with magic']
  },
  Dwarf: {
    race: 'Dwarf',
    possibleClasses: ['Fighter', 'Cleric', 'Barbarian', 'Paladin', 'Ranger', 'Rogue', 'Wizard'],
    personalityTraits: ['Hardy', 'Proud', 'Gruff', 'Loyal', 'Traditional', 'Determined', 'Honest', 'Suspicious', 'Hardworking', 'Clan-oriented'],
    backgrounds: ['Artisan', 'Soldier', 'Merchant', 'Miner', 'Noble', 'Guild Member', 'Folk Hero'],
    motivations: ['Clan honor', 'Master craftsmanship', 'Ancient traditions', 'Protecting the homeland', 'Proving worthiness', 'Accumulating wealth', 'Avenging wrongs', 'Creating lasting works', 'Family legacy', 'Defeating ancient enemies'],
    quirks: ['Braids their beard when thinking', 'Never backs down from a drinking contest', 'Judges people by their craftsmanship', 'Keeps detailed genealogy records', 'Distrusts magic users', 'Always carries quality tools', 'Speaks in mining metaphors', 'Has strong opinions about ale', 'Carves stone when nervous', 'Remembers every slight']
  },
  Halfling: {
    race: 'Halfling',
    possibleClasses: ['Rogue', 'Ranger', 'Bard', 'Cleric', 'Fighter', 'Monk', 'Druid'],
    personalityTraits: ['Cheerful', 'Curious', 'Brave', 'Friendly', 'Practical', 'Optimistic', 'Hospitable', 'Cautious', 'Community-minded', 'Food-loving'],
    backgrounds: ['Folk Hero', 'Entertainer', 'Merchant', 'Farmer', 'Criminal', 'Hermit', 'Sailor'],
    motivations: ['Community welfare', 'Simple pleasures', 'Family safety', 'Good food and drink', 'Peaceful coexistence', 'Helping others', 'Exploring the world', 'Preserving traditions', 'Finding home', 'Unexpected adventure'],
    quirks: ['Always offers food to guests', 'Knows everyone\'s business', 'Excellent gardener', 'Superstitious about lucky charms', 'Tells long stories about ancestors', 'Never wastes food', 'Excellent judge of character', 'Afraid of big cities', 'Collects recipe books', 'Naps after every meal']
  },
  Dragonborn: {
    race: 'Dragonborn',
    possibleClasses: ['Paladin', 'Fighter', 'Sorcerer', 'Barbarian', 'Cleric', 'Warlock', 'Bard'],
    personalityTraits: ['Proud', 'Honor-bound', 'Draconic', 'Noble', 'Intense', 'Ambitious', 'Traditional', 'Powerful', 'Disciplined', 'Passionate'],
    backgrounds: ['Noble', 'Soldier', 'Clan Member', 'Hermit', 'Outlander', 'Folk Hero', 'Acolyte'],
    motivations: ['Draconic heritage', 'Personal honor', 'Clan glory', 'Proving strength', 'Ancient oaths', 'Draconic prophecy', 'Restoring bloodline', 'Mastering breath weapon', 'Leading others', 'Draconic treasure'],
    quirks: ['Breathes small puffs when emotional', 'Collects shiny objects', 'Speaks of ancestors constantly', 'Values strength above all', 'Sleeps on hard surfaces', 'Hoards one type of item', 'Judges others by their courage', 'Has draconic mannerisms', 'Sensitive about their scales', 'Practices breath control']
  },
  Tiefling: {
    race: 'Tiefling',
    possibleClasses: ['Warlock', 'Sorcerer', 'Bard', 'Rogue', 'Paladin', 'Cleric', 'Fighter'],
    personalityTraits: ['Charismatic', 'Suspicious', 'Self-reliant', 'Dramatic', 'Cunning', 'Passionate', 'Outsider', 'Determined', 'Rebellious', 'Intense'],
    backgrounds: ['Criminal', 'Entertainer', 'Outlander', 'Folk Hero', 'Hermit', 'Charlatan', 'Noble'],
    motivations: ['Overcoming prejudice', 'Proving worth', 'Infernal heritage', 'Personal freedom', 'Breaking stereotypes', 'Finding acceptance', 'Demonic bargains', 'Protecting outcasts', 'Seeking power', 'Redemption'],
    quirks: ['Horns grow when lying', 'Tail twitches when nervous', 'Speaks Infernal when angry', 'Attracted to forbidden knowledge', 'Makes pacts easily', 'Distrusts authority', 'Fascinated by fire', 'Has prophetic nightmares', 'Collects contracts', 'Temperature runs hot']
  }
};

const occupations = [
  'Blacksmith', 'Tavern Keeper', 'Merchant', 'Guard', 'Scholar', 'Priest', 'Farmer', 'Baker', 
  'Stable Master', 'Healer', 'Scribe', 'Hunter', 'Fisher', 'Carpenter', 'Mason', 'Weaver',
  'Innkeeper', 'Librarian', 'Alchemist', 'Jeweler', 'Leatherworker', 'Shipwright', 'Miner',
  'Town Crier', 'Street Sweeper', 'Gravedigger', 'Messenger', 'Cook', 'Barber', 'Beggar'
];

const generateRandomName = (race: string): string => {
  const namesByRace: { [key: string]: { first: string[], last: string[] } } = {
    Human: {
      first: ['Aiden', 'Bryn', 'Cora', 'Dane', 'Elara', 'Finn', 'Gwen', 'Hale', 'Ivy', 'Jace', 'Kira', 'Liam', 'Maya', 'Nora', 'Owen', 'Piper', 'Quinn', 'Rhea', 'Sean', 'Tara'],
      last: ['Ashford', 'Blackwater', 'Crownfield', 'Drakemoor', 'Evergreen', 'Fairwind', 'Goldleaf', 'Hartwell', 'Ironwood', 'Kingsley', 'Lightbringer', 'Moonwhisper', 'Nightshade', 'Oakenheart', 'Proudfoot', 'Quicksilver', 'Ravencrest', 'Silverstone', 'Thornfield', 'Whitehawk']
    },
    Elf: {
      first: ['Aelar', 'Berrian', 'Drannor', 'Enna', 'Galinndan', 'Halimath', 'Ivellios', 'Laucian', 'Mindartis', 'Naal', 'Nutae', 'Paelinn', 'Peren', 'Quarion', 'Riardon', 'Rolen', 'Suhnaal', 'Thamior', 'Theren', 'Theriatis'],
      last: ['Amakir', 'Amastacia', 'Galanodel', 'Holimion', 'Liadon', 'Meliamne', 'Nailo', 'Siannodel', 'Xiloscient', 'Alderleaf', 'Brushgather', 'Goodbarrel', 'Greenbottle', 'High-hill', 'Hilltopple', 'Leagallow', 'Tealeaf', 'Thorngage', 'Tosscobble', 'Underbough']
    },
    Dwarf: {
      first: ['Adrik', 'Alberich', 'Baern', 'Barendd', 'Brottor', 'Bruenor', 'Dain', 'Darrak', 'Delg', 'Eberk', 'Einkil', 'Fargrim', 'Flint', 'Gardain', 'Harbek', 'Kildrak', 'Morgran', 'Orsik', 'Oskar', 'Rangrim'],
      last: ['Battlehammer', 'Brawnanvil', 'Dankil', 'Fireforge', 'Frostbeard', 'Gorunn', 'Holderhek', 'Ironfist', 'Loderr', 'Lutgehr', 'Rumnaheim', 'Strakeln', 'Torunn', 'Ungart', 'Axebreaker', 'Battlehammer', 'Brawnanvil', 'Dankil', 'Fireforge', 'Frostbeard']
    },
    Halfling: {
      first: ['Alton', 'Ander', 'Cade', 'Corrin', 'Eldon', 'Errich', 'Finnan', 'Garret', 'Lindal', 'Lyle', 'Merric', 'Milo', 'Osborn', 'Perrin', 'Reed', 'Roscoe', 'Wellby', 'Andry', 'Chancy', 'Corrin'],
      last: ['Brushgather', 'Goodbarrel', 'Greenbottle', 'High-hill', 'Hilltopple', 'Leagallow', 'Tealeaf', 'Thorngage', 'Tosscobble', 'Underbough', 'Alderleaf', 'Brushgather', 'Goodbarrel', 'Greenbottle', 'High-hill', 'Hilltopple', 'Leagallow', 'Tealeaf', 'Thorngage', 'Tosscobble']
    },
    Dragonborn: {
      first: ['Arjhan', 'Balasar', 'Bharash', 'Donaar', 'Ghesh', 'Heskan', 'Kriv', 'Medrash', 'Mehen', 'Nadarr', 'Pandjed', 'Patrin', 'Rhogar', 'Shamash', 'Shedinn', 'Tarhun', 'Torinn', 'Akra', 'Biri', 'Daar'],
      last: ['Clethtinthiallor', 'Daardendrian', 'Delmirev', 'Drachedandion', 'Fenkenkabradon', 'Kepeshkmolik', 'Kerrhylon', 'Kimbatuul', 'Linxakasendalor', 'Myastan', 'Nemmonis', 'Norixius', 'Ophinshtalajiir', 'Prexijandilin', 'Shestendeliath', 'Turnuroth', 'Verthisathurgiesh', 'Yarjerit', 'Clethtinthiallor', 'Daardendrian']
    },
    Tiefling: {
      first: ['Akmenos', 'Amnon', 'Barakas', 'Damakos', 'Ekemon', 'Iados', 'Kairon', 'Leucis', 'Melech', 'Mordai', 'Morthos', 'Pelaios', 'Skamos', 'Therai', 'Akta', 'Anakir', 'Armara', 'Astaro', 'Aym', 'Azza'],
      last: ['Art', 'Carrion', 'Chant', 'Creed', 'Despair', 'Excellence', 'Fear', 'Glory', 'Hope', 'Ideal', 'Music', 'Nowhere', 'Open', 'Poetry', 'Quest', 'Random', 'Reverence', 'Sorrow', 'Temerity', 'Torment']
    }
  };

  const names = namesByRace[race] || namesByRace.Human;
  const firstName = names.first[Math.floor(Math.random() * names.first.length)];
  const lastName = names.last[Math.floor(Math.random() * names.last.length)];
  
  return `${firstName} ${lastName}`;
};

const getRandomElement = <T,>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};

export const NPCGenerator = ({ isOpen, onClose, onGenerate, campaignId }: NPCGeneratorProps) => {
  const [generatedNPC, setGeneratedNPC] = useState<Omit<Character, 'id'> | null>(null);
  const [selectedRace, setSelectedRace] = useState<string>('Human');

  const generateNPC = () => {
    const template = raceTemplates[selectedRace];
    const name = generateRandomName(selectedRace);
    const npcClass = getRandomElement(template.possibleClasses);
    const personality = getRandomElement(template.personalityTraits);
    const background = getRandomElement(template.backgrounds);
    const motivation = getRandomElement(template.motivations);
    const quirk = getRandomElement(template.quirks);
    const occupation = getRandomElement(occupations);
    
    const npcType = Math.random() > 0.7 ? 'Villain' : Math.random() > 0.3 ? 'Ally' : 'NPC';

    const description = `A ${personality.toLowerCase()} ${template.race.toLowerCase()} with a ${background.toLowerCase()} background. Currently works as a ${occupation.toLowerCase()}. 

Motivation: ${motivation}
Personality: ${personality}
Notable Quirk: ${quirk}

This character can serve as ${npcType === 'Villain' ? 'an antagonist' : npcType === 'Ally' ? 'a helpful ally' : 'a neutral NPC'} in your campaign.`;

    const npc: Omit<Character, 'id'> = {
      campaignId,
      name,
      type: npcType as Character['type'],
      race: template.race,
      class: npcClass,
      description,
      tags: [personality.toLowerCase(), background.toLowerCase(), occupation.toLowerCase(), 'generated']
    };

    setGeneratedNPC(npc);
  };

  const handleUseNPC = () => {
    if (generatedNPC) {
      onGenerate(generatedNPC);
      onClose();
      setGeneratedNPC(null);
    }
  };

  const handleClose = () => {
    onClose();
    setGeneratedNPC(null);
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="NPC Generator">
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Race
          </label>
          <select
            value={selectedRace}
            onChange={(e) => setSelectedRace(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.keys(raceTemplates).map(race => (
              <option key={race} value={race}>{race}</option>
            ))}
          </select>
        </div>

        <div className="text-center">
          <button
            onClick={generateNPC}
            className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium"
          >
            🎲 Generate Random NPC
          </button>
        </div>

        {generatedNPC && (
          <div className="bg-gray-50 rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">{generatedNPC.name}</h3>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                generatedNPC.type === 'Villain' ? 'bg-red-100 text-red-800' :
                generatedNPC.type === 'Ally' ? 'bg-green-100 text-green-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {generatedNPC.type}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-medium text-gray-600">Race:</span>
                <span className="ml-2">{generatedNPC.race}</span>
              </div>
              <div>
                <span className="font-medium text-gray-600">Class:</span>
                <span className="ml-2">{generatedNPC.class}</span>
              </div>
            </div>

            <div>
              <span className="font-medium text-gray-600">Description:</span>
              <div className="mt-1 text-gray-700 whitespace-pre-line text-sm">
                {generatedNPC.description}
              </div>
            </div>

            <div>
              <span className="font-medium text-gray-600">Tags:</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {generatedNPC.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={generateNPC}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                🎲 Generate Another
              </button>
              <button
                onClick={handleUseNPC}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                ✓ Use This NPC
              </button>
            </div>
          </div>
        )}

        {!generatedNPC && (
          <div className="text-center text-gray-500 py-8">
            <p>Click "Generate Random NPC" to create a new character for your campaign.</p>
            <p className="text-sm mt-2">Each NPC comes with personality traits, background, motivations, and quirks.</p>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
};