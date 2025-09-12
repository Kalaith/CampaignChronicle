<?php

namespace App\Controllers;

use App\Models\Campaign;
use App\Models\Character;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

class NPCController extends BaseController
{
    private array $raceTemplates = [
        'Human' => [
            'race' => 'Human',
            'possibleClasses' => ['Fighter', 'Wizard', 'Rogue', 'Cleric', 'Ranger', 'Bard', 'Paladin', 'Barbarian', 'Monk', 'Sorcerer', 'Warlock', 'Druid'],
            'personalityTraits' => ['Ambitious', 'Curious', 'Generous', 'Stubborn', 'Loyal', 'Skeptical', 'Cheerful', 'Serious', 'Brave', 'Cautious'],
            'backgrounds' => ['Noble', 'Merchant', 'Soldier', 'Scholar', 'Artisan', 'Farmer', 'Criminal', 'Entertainer', 'Hermit', 'Sailor'],
            'motivations' => ['Wealth and power', 'Knowledge and wisdom', 'Family honor', 'Personal freedom', 'Justice and order', 'Adventure and glory', 'Love and companionship', 'Revenge', 'Peace and safety', 'Recognition'],
            'quirks' => ['Always carries a lucky coin', 'Speaks in riddles', 'Collects interesting rocks', 'Hums while working', 'Never removes their hat', 'Afraid of heights', 'Excellent memory for faces', 'Terrible at names', 'Always hungry', 'Superstitious about omens']
        ],
        'Elf' => [
            'race' => 'Elf',
            'possibleClasses' => ['Wizard', 'Ranger', 'Rogue', 'Bard', 'Druid', 'Sorcerer', 'Fighter', 'Cleric'],
            'personalityTraits' => ['Elegant', 'Patient', 'Arrogant', 'Wise', 'Mysterious', 'Graceful', 'Aloof', 'Artistic', 'Perfectionist', 'Contemplative'],
            'backgrounds' => ['Noble', 'Scholar', 'Artisan', 'Hermit', 'Entertainer', 'Outlander', 'Acolyte'],
            'motivations' => ['Preserving ancient knowledge', 'Protecting nature', 'Artistic perfection', 'Long-term planning', 'Cultural superiority', 'Magical mastery', 'Ancient grudges', 'Eternal beauty', 'Harmony with nature', 'Ancestral duty'],
            'quirks' => ['Speaks in an archaic dialect', 'Cannot resist correcting others', 'Meditates at dawn', 'Writes poetry about everything', 'Fascinated by mortal customs', 'Never hurries', 'Collects rare books', 'Dislikes iron tools', 'Has prophetic dreams', 'Ages wine with magic']
        ],
        'Dwarf' => [
            'race' => 'Dwarf',
            'possibleClasses' => ['Fighter', 'Cleric', 'Barbarian', 'Paladin', 'Ranger', 'Rogue', 'Wizard'],
            'personalityTraits' => ['Hardy', 'Proud', 'Gruff', 'Loyal', 'Traditional', 'Determined', 'Honest', 'Suspicious', 'Hardworking', 'Clan-oriented'],
            'backgrounds' => ['Artisan', 'Soldier', 'Merchant', 'Miner', 'Noble', 'Guild Member', 'Folk Hero'],
            'motivations' => ['Clan honor', 'Master craftsmanship', 'Ancient traditions', 'Protecting the homeland', 'Proving worthiness', 'Accumulating wealth', 'Avenging wrongs', 'Creating lasting works', 'Family legacy', 'Defeating ancient enemies'],
            'quirks' => ['Braids their beard when thinking', 'Never backs down from a drinking contest', 'Judges people by their craftsmanship', 'Keeps detailed genealogy records', 'Distrusts magic users', 'Always carries quality tools', 'Speaks in mining metaphors', 'Has strong opinions about ale', 'Carves stone when nervous', 'Remembers every slight']
        ],
        'Halfling' => [
            'race' => 'Halfling',
            'possibleClasses' => ['Rogue', 'Ranger', 'Bard', 'Cleric', 'Fighter', 'Monk', 'Druid'],
            'personalityTraits' => ['Cheerful', 'Curious', 'Brave', 'Friendly', 'Practical', 'Optimistic', 'Hospitable', 'Cautious', 'Community-minded', 'Food-loving'],
            'backgrounds' => ['Folk Hero', 'Entertainer', 'Merchant', 'Farmer', 'Criminal', 'Hermit', 'Sailor'],
            'motivations' => ['Simple pleasures', 'Community safety', 'Good food and drink', 'Family bonds', 'Peaceful life', 'Small adventures', 'Helping others', 'Preserving traditions', 'Finding comfort', 'Making friends'],
            'quirks' => ['Always offers food to guests', 'Counts things compulsively', 'Tells long-winded stories', 'Excellent judge of character', 'Lucky with games of chance', 'Afraid of large bodies of water', 'Keeps a detailed journal', 'Never passes up a meal', 'Collects small trinkets', 'Hums while walking']
        ],
        'Dragonborn' => [
            'race' => 'Dragonborn',
            'possibleClasses' => ['Paladin', 'Fighter', 'Sorcerer', 'Barbarian', 'Cleric', 'Bard', 'Warlock'],
            'personalityTraits' => ['Proud', 'Honorable', 'Strong-willed', 'Passionate', 'Direct', 'Noble', 'Fierce', 'Disciplined', 'Ambitious', 'Traditional'],
            'backgrounds' => ['Noble', 'Soldier', 'Clan Member', 'Hermit', 'Acolyte', 'Folk Hero', 'Guild Artisan'],
            'motivations' => ['Clan honor', 'Draconic heritage', 'Personal excellence', 'Proving worthiness', 'Ancient oaths', 'Protecting others', 'Mastering power', 'Upholding traditions', 'Seeking glory', 'Redeeming past mistakes'],
            'quirks' => ['Breathes small puffs of energy when excited', 'Collects shiny objects', 'Speaks formally', 'Has strong sense of smell', 'Sleeps on hard surfaces', 'Judges others by their courage', 'Never shows weakness', 'Practices combat daily', 'Remembers ancient lore', 'Territorial about personal space']
        ],
        'Tiefling' => [
            'race' => 'Tiefling',
            'possibleClasses' => ['Warlock', 'Sorcerer', 'Rogue', 'Bard', 'Paladin', 'Cleric', 'Wizard'],
            'personalityTraits' => ['Suspicious', 'Charismatic', 'Rebellious', 'Independent', 'Cunning', 'Mysterious', 'Passionate', 'Determined', 'Misunderstood', 'Adaptable'],
            'backgrounds' => ['Charlatan', 'Criminal', 'Entertainer', 'Hermit', 'Outlander', 'Sage', 'Folk Hero'],
            'motivations' => ['Overcoming prejudice', 'Proving their worth', 'Finding acceptance', 'Embracing their nature', 'Seeking redemption', 'Personal freedom', 'Hidden knowledge', 'Power to protect others', 'Breaking stereotypes', 'Creating their own destiny'],
            'quirks' => ['Tail twitches when lying', 'Eyes glow when angry', 'Always wears gloves', 'Fascinated by religious symbols', 'Speaks multiple languages', 'Never sleeps in the same place twice', 'Excellent at reading people', 'Keeps detailed notes on everyone', 'Changes appearance frequently', 'Always has an escape plan']
        ]
    ];

    private array $namesByRace = [
        'Human' => [
            'first' => ['Aerdrie', 'Ahvain', 'Aramil', 'Berris', 'Cithreth', 'Drannor', 'Enna', 'Galinndan', 'Hadarai', 'Halimath', 'Heian', 'Himo', 'Immeral', 'Ivellios', 'Laucian', 'Mindartis', 'Naal', 'Nutae', 'Paelynn', 'Peren', 'Quarion', 'Riardon', 'Rolen', 'Silvyr', 'Suhnab', 'Thamior', 'Theren', 'Theriatis', 'Thervan', 'Uthemar', 'Vanuath', 'Varis'],
            'last' => ['Amakir', 'Amakyr', 'Galanodel', 'Holimion', 'Liadon', 'Meliamne', 'Nailo', 'Siannodel', 'Xiloscient', 'Alderleaf', 'Brushgather', 'Goodbarrel', 'Greenbottle', 'High-hill', 'Hilltopple', 'Leagallow', 'Tealeaf', 'Thorngage', 'Tosscobble', 'Underbough']
        ],
        'Elf' => [
            'first' => ['Aerdrie', 'Ahvain', 'Aramil', 'Berris', 'Cithreth', 'Drannor', 'Enna', 'Galinndan', 'Hadarai', 'Halimath', 'Heian', 'Himo', 'Immeral', 'Ivellios', 'Laucian', 'Mindartis', 'Naal', 'Nutae', 'Paelynn', 'Peren', 'Quarion', 'Riardon', 'Rolen', 'Silvyr', 'Suhnab', 'Thamior', 'Theren', 'Theriatis', 'Thervan', 'Uthemar', 'Vanuath', 'Varis'],
            'last' => ['Amakir', 'Amakyr', 'Galanodel', 'Holimion', 'Liadon', 'Meliamne', 'Nailo', 'Siannodel', 'Xiloscient']
        ],
        'Dwarf' => [
            'first' => ['Adrik', 'Alberich', 'Baern', 'Barendd', 'Brottor', 'Bruenor', 'Dain', 'Darrak', 'Delg', 'Eberk', 'Einkil', 'Fargrim', 'Flint', 'Gardain', 'Harbek', 'Kildrak', 'Morgran', 'Orsik', 'Oskar', 'Rangrim', 'Rurik', 'Taklinn', 'Thoradin', 'Thorek', 'Tordek', 'Traubon', 'Travok', 'Ulfgar', 'Veit', 'Vondal'],
            'last' => ['Battlehammer', 'Brawnanvil', 'Dankil', 'Fireforge', 'Frostbeard', 'Gorunn', 'Holderhek', 'Ironfist', 'Loderr', 'Lutgehr', 'Rumnaheim', 'Strakeln', 'Torunn', 'Ungart']
        ],
        'Halfling' => [
            'first' => ['Alton', 'Ander', 'Cade', 'Corrin', 'Eldon', 'Errich', 'Finnan', 'Garret', 'Lindal', 'Lyle', 'Merric', 'Milo', 'Osborn', 'Perrin', 'Reed', 'Roscoe', 'Wellby', 'Andry', 'Chenna', 'Dee', 'Jillian', 'Kithri', 'Lavinia', 'Lidda', 'Merla', 'Nedda', 'Paela', 'Portia', 'Seraphina', 'Shaena', 'Trym', 'Vani', 'Verna'],
            'last' => ['Alderleaf', 'Brushgather', 'Goodbarrel', 'Greenbottle', 'High-hill', 'Hilltopple', 'Leagallow', 'Tealeaf', 'Thorngage', 'Tosscobble', 'Underbough']
        ],
        'Dragonborn' => [
            'first' => ['Arjhan', 'Balasar', 'Bharash', 'Donaar', 'Ghesh', 'Heskan', 'Kriv', 'Medrash', 'Mehen', 'Nadarr', 'Pandjed', 'Patrin', 'Rhogar', 'Shamash', 'Shedinn', 'Tarhun', 'Torinn', 'Akra', 'Biri', 'Daar', 'Farideh', 'Harann', 'Havilar', 'Jheri', 'Kava', 'Korinn', 'Mishann', 'Nala', 'Perra', 'Raiann', 'Sora', 'Surina', 'Thava', 'Uadjit'],
            'last' => ['Clethtinthiallor', 'Daardendrian', 'Delmirev', 'Drachedandion', 'Fenkenkabradon', 'Kepeshkmolik', 'Kerrhylon', 'Kimbatuul', 'Linxakasendalor', 'Myastan', 'Nemmonis', 'Norixius', 'Ophinshtalajiir', 'Prexijandilin', 'Shestendeliath', 'Turnuroth', 'Verthisathurgiesh', 'Yarjerit']
        ],
        'Tiefling' => [
            'first' => ['Akmenos', 'Amnon', 'Barakas', 'Damakos', 'Ekemon', 'Iados', 'Kairon', 'Leucis', 'Melech', 'Mordai', 'Morthos', 'Pelaios', 'Skamos', 'Therai', 'Akta', 'Anakir', 'Armara', 'Astaro', 'Aym', 'Azza'],
            'last' => ['Art', 'Carrion', 'Chant', 'Creed', 'Despair', 'Excellence', 'Fear', 'Glory', 'Hope', 'Ideal', 'Music', 'Nowhere', 'Open', 'Poetry', 'Quest', 'Random', 'Reverence', 'Sorrow', 'Temerity', 'Torment']
        ]
    ];

    private array $occupations = [
        'Blacksmith', 'Tavern Keeper', 'Merchant', 'Guard', 'Farmer', 'Scholar', 'Healer', 'Bard', 'Hunter', 'Fisher',
        'Baker', 'Carpenter', 'Mason', 'Jeweler', 'Tailor', 'Scribe', 'Alchemist', 'Stable Master', 'Cook', 'Librarian',
        'Priest', 'Judge', 'Captain', 'Thief', 'Assassin', 'Spy', 'Noble', 'Beggar', 'Entertainer', 'Messenger'
    ];

    /**
     * Generate a random NPC.
     */
    public function generate(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $userId = $this->getUserId($request);
        $campaignId = $args['campaign_id'] ?? null;

        if (!$campaignId) {
            return $this->error($response, 'Campaign ID is required', 400);
        }

        // Verify campaign ownership
        $campaign = Campaign::where('id', $campaignId)
            ->where('user_id', $userId)
            ->first();

        if (!$campaign) {
            return $this->notFound($response, 'Campaign not found');
        }

        $queryParams = $this->getQueryParams($request);
        $race = $queryParams['race'] ?? $this->getRandomElement(array_keys($this->raceTemplates));

        // Validate race
        if (!isset($this->raceTemplates[$race])) {
            return $this->error($response, 'Invalid race specified', 400);
        }

        try {
            $npcData = $this->generateNPCData($race, $campaignId);
            
            // Option to save directly or just return the data
            $autoSave = $queryParams['auto_save'] ?? false;
            
            if ($autoSave) {
                $npc = new Character([
                    'user_id' => $userId,
                    'campaign_id' => $campaignId,
                    'name' => $npcData['name'],
                    'type' => $npcData['type'],
                    'race' => $npcData['race'],
                    'class' => $npcData['class'],
                    'description' => $npcData['description'],
                    'tags' => $npcData['tags'],
                ]);

                $npc->save();
                
                return $this->success($response, $npc, 'NPC generated and saved successfully', 201);
            } else {
                return $this->success($response, $npcData, 'NPC generated successfully');
            }

        } catch (\Exception $e) {
            error_log("NPC generation failed: " . $e->getMessage());
            return $this->error($response, 'Failed to generate NPC', 500);
        }
    }

    /**
     * Get available races for NPC generation.
     */
    public function getRaces(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $races = array_map(function($race, $template) {
            return [
                'name' => $race,
                'classes' => $template['possibleClasses'],
                'traits' => count($template['personalityTraits']),
                'backgrounds' => count($template['backgrounds']),
                'motivations' => count($template['motivations']),
                'quirks' => count($template['quirks'])
            ];
        }, array_keys($this->raceTemplates), $this->raceTemplates);

        return $this->success($response, array_values($races));
    }

    /**
     * Get race template details.
     */
    public function getRaceTemplate(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $race = $args['race'] ?? null;

        if (!$race || !isset($this->raceTemplates[$race])) {
            return $this->error($response, 'Invalid or missing race', 400);
        }

        return $this->success($response, $this->raceTemplates[$race]);
    }

    /**
     * Generate multiple NPCs at once.
     */
    public function generateBatch(ServerRequestInterface $request, ResponseInterface $response, array $args): ResponseInterface
    {
        $userId = $this->getUserId($request);
        $campaignId = $args['campaign_id'] ?? null;

        if (!$campaignId) {
            return $this->error($response, 'Campaign ID is required', 400);
        }

        // Verify campaign ownership
        $campaign = Campaign::where('id', $campaignId)
            ->where('user_id', $userId)
            ->first();

        if (!$campaign) {
            return $this->notFound($response, 'Campaign not found');
        }

        $data = $this->getRequestData($request);
        $count = min((int)($data['count'] ?? 5), 20); // Limit to 20 NPCs max
        $races = $data['races'] ?? null; // Optional array of specific races
        $autoSave = $data['auto_save'] ?? false;

        try {
            $npcs = [];
            $savedNpcs = [];

            for ($i = 0; $i < $count; $i++) {
                $race = $races && !empty($races) 
                    ? $this->getRandomElement($races) 
                    : $this->getRandomElement(array_keys($this->raceTemplates));

                $npcData = $this->generateNPCData($race, $campaignId);
                $npcs[] = $npcData;

                if ($autoSave) {
                    $npc = new Character([
                        'user_id' => $userId,
                        'campaign_id' => $campaignId,
                        'name' => $npcData['name'],
                        'type' => $npcData['type'],
                        'race' => $npcData['race'],
                        'class' => $npcData['class'],
                        'description' => $npcData['description'],
                        'tags' => $npcData['tags'],
                    ]);

                    $npc->save();
                    $savedNpcs[] = $npc;
                }
            }

            $result = [
                'count' => $count,
                'npcs' => $autoSave ? $savedNpcs : $npcs
            ];

            return $this->success($response, $result, $autoSave ? 'NPCs generated and saved successfully' : 'NPCs generated successfully', $autoSave ? 201 : 200);

        } catch (\Exception $e) {
            error_log("Batch NPC generation failed: " . $e->getMessage());
            return $this->error($response, 'Failed to generate NPCs', 500);
        }
    }

    /**
     * Generate NPC data.
     */
    private function generateNPCData(string $race, string $campaignId): array
    {
        $template = $this->raceTemplates[$race];
        $name = $this->generateRandomName($race);
        $class = $this->getRandomElement($template['possibleClasses']);
        $personality = $this->getRandomElement($template['personalityTraits']);
        $background = $this->getRandomElement($template['backgrounds']);
        $motivation = $this->getRandomElement($template['motivations']);
        $quirk = $this->getRandomElement($template['quirks']);
        $occupation = $this->getRandomElement($this->occupations);

        // Determine NPC type based on random chance
        $rand = rand(1, 100);
        $npcType = $rand > 70 ? 'Villain' : ($rand > 30 ? 'Ally' : 'NPC');

        $description = "A {$personality} {$race} with a {$background} background. Currently works as a {$occupation}.\n\n" .
                      "Motivation: {$motivation}\n" .
                      "Personality: {$personality}\n" .
                      "Notable Quirk: {$quirk}\n\n" .
                      "This character can serve as " . 
                      ($npcType === 'Villain' ? 'an antagonist' : 
                       ($npcType === 'Ally' ? 'a helpful ally' : 'a neutral NPC')) . 
                      " in your campaign.";

        return [
            'campaignId' => $campaignId,
            'name' => $name,
            'type' => $npcType,
            'race' => $race,
            'class' => $class,
            'description' => $description,
            'tags' => [strtolower($personality), strtolower($background), strtolower($occupation), 'generated'],
            'background' => $background,
            'motivation' => $motivation,
            'quirk' => $quirk,
            'occupation' => $occupation,
            'personality' => $personality
        ];
    }

    /**
     * Generate a random name based on race.
     */
    private function generateRandomName(string $race): string
    {
        $names = $this->namesByRace[$race] ?? $this->namesByRace['Human'];
        $firstName = $this->getRandomElement($names['first']);
        $lastName = $this->getRandomElement($names['last']);
        
        return "{$firstName} {$lastName}";
    }

    /**
     * Get a random element from an array.
     */
    private function getRandomElement(array $array)
    {
        return $array[array_rand($array)];
    }
}