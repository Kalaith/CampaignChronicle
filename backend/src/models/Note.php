<?php

namespace App\Models;

class Note extends BaseModel
{
    protected $table = 'notes';

    protected $fillable = [
        'campaign_id',
        'title',
        'content',
        'tags',
    ];

    protected $casts = [
        'tags' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the campaign that owns the note.
     */
    public function campaign()
    {
        return $this->belongsTo(Campaign::class);
    }

    /**
     * Scope a query to search notes by content.
     */
    public function scopeSearchContent($query, $term)
    {
        return $query->where(function ($q) use ($term) {
            $q->where('title', 'LIKE', "%{$term}%")
              ->orWhere('content', 'LIKE', "%{$term}%");
        });
    }

    /**
     * Scope a query to get recent notes.
     */
    public function scopeRecent($query, $days = 7)
    {
        return $query->where('updated_at', '>=', now()->subDays($days));
    }

    /**
     * Get note word count.
     */
    public function getWordCount()
    {
        return str_word_count(strip_tags($this->content ?? ''));
    }

    /**
     * Get note character count.
     */
    public function getCharacterCount()
    {
        return mb_strlen(strip_tags($this->content ?? ''));
    }

    /**
     * Get note excerpt.
     */
    public function getExcerpt($length = 200)
    {
        $content = strip_tags($this->content ?? '');
        return mb_strlen($content) > $length 
            ? mb_substr($content, 0, $length) . '...'
            : $content;
    }

    /**
     * Check if note is recent (updated in last 24 hours).
     */
    public function isRecent()
    {
        return $this->updated_at > now()->subDay();
    }

    /**
     * Get notes activity for a campaign.
     */
    public static function getActivity($campaignId, $days = 30)
    {
        return static::where('campaign_id', $campaignId)
            ->where('created_at', '>=', now()->subDays($days))
            ->selectRaw('DATE(created_at) as date, COUNT(*) as count')
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->mapWithKeys(fn($item) => [$item->date => $item->count]);
    }

    /**
     * Get popular tags for notes in a campaign.
     */
    public static function getPopularTags($campaignId, $limit = 10)
    {
        $notes = static::where('campaign_id', $campaignId)
            ->whereNotNull('tags')
            ->get();

        $tagCounts = [];
        foreach ($notes as $note) {
            foreach ($note->tags ?? [] as $tag) {
                $tagCounts[$tag] = ($tagCounts[$tag] ?? 0) + 1;
            }
        }

        arsort($tagCounts);
        return array_slice($tagCounts, 0, $limit, true);
    }

    /**
     * Find notes that reference a character, location, or item.
     */
    public static function findReferences($campaignId, $entityName, $entityType = null)
    {
        $query = static::where('campaign_id', $campaignId)
            ->where(function ($q) use ($entityName) {
                $q->where('title', 'LIKE', "%{$entityName}%")
                  ->orWhere('content', 'LIKE', "%{$entityName}%");
            });

        if ($entityType) {
            $query->withTag($entityType);
        }

        return $query->get();
    }

    /**
     * Get note summary with metadata.
     */
    public function getSummary()
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'excerpt' => $this->getExcerpt(),
            'word_count' => $this->getWordCount(),
            'character_count' => $this->getCharacterCount(),
            'is_recent' => $this->isRecent(),
            'tags' => $this->tags ?? [],
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }

    protected function getSearchableFields()
    {
        return ['title', 'content'];
    }
}