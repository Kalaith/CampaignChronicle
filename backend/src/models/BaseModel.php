<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Ramsey\Uuid\Uuid;

abstract class BaseModel extends Model
{
    /**
     * Indicates if the IDs are auto-incrementing.
     */
    public $incrementing = false;

    /**
     * The "type" of the auto-incrementing ID.
     */
    protected $keyType = 'string';

    /**
     * The attributes that should be cast to native types.
     */
    protected $casts = [
        'tags' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'user_id',
        'name',
        'title',
        'description',
        'tags'
    ];

    /**
     * Boot the model and generate UUID on creation.
     */
    public function __construct(array $attributes = [])
    {
        parent::__construct($attributes);
        
        // Set UUID if not already set
        if (empty($this->attributes[$this->getKeyName()])) {
            $this->attributes[$this->getKeyName()] = (string) Uuid::uuid4();
        }
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->{$model->getKeyName()})) {
                $model->{$model->getKeyName()} = (string) Uuid::uuid4();
            }
        });
    }

    /**
     * Scope a query to search by text.
     */
    public function scopeSearch($query, $term)
    {
        return $query->where(function ($q) use ($term) {
            $searchableFields = $this->getSearchableFields();
            foreach ($searchableFields as $field) {
                $q->orWhere($field, 'LIKE', "%{$term}%");
            }
        });
    }

    /**
     * Get the searchable fields for the model.
     */
    protected function getSearchableFields()
    {
        return ['name', 'title', 'description'];
    }

    /**
     * Scope a query to filter by tags.
     */
    public function scopeWithTag($query, $tag)
    {
        return $query->whereJsonContains('tags', $tag);
    }

    /**
     * Scope a query to filter by multiple tags.
     */
    public function scopeWithTags($query, array $tags)
    {
        return $query->where(function ($q) use ($tags) {
            foreach ($tags as $tag) {
                $q->whereJsonContains('tags', $tag);
            }
        });
    }

    /**
     * Add a tag to the model.
     */
    public function addTag($tag)
    {
        $tags = $this->tags ?? [];
        if (!in_array($tag, $tags)) {
            $tags[] = $tag;
            $this->tags = $tags;
        }
        return $this;
    }

    /**
     * Remove a tag from the model.
     */
    public function removeTag($tag)
    {
        $tags = $this->tags ?? [];
        $this->tags = array_values(array_filter($tags, fn($t) => $t !== $tag));
        return $this;
    }

    /**
     * Get all unique tags for the model type.
     */
    public static function getAllTags()
    {
        return static::whereNotNull('tags')
            ->pluck('tags')
            ->flatten()
            ->unique()
            ->values()
            ->toArray();
    }

    /**
     * Scope a query to filter by user.
     */
    public function scopeForUser($query, string $userId)
    {
        return $query->where('user_id', $userId);
    }
}