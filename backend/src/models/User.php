<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class User extends Model
{
    protected $table = 'users';
    
    public $incrementing = false;
    protected $keyType = 'string';
    
    protected $fillable = [
        'auth0_id',
        'email',
        'display_name',
        'username',
        'role',
        'is_verified',
        'password_hash',
        'created_at',
        'updated_at'
    ];

    protected $casts = [
        'is_verified' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }
        });
    }

    public function __construct(array $attributes = [])
    {
        parent::__construct($attributes);
        
        if (empty($this->id)) {
            $this->id = (string) Str::uuid();
        }
    }

    // Relationships with other models
    public function campaigns()
    {
        return $this->hasMany(Campaign::class);
    }

    public function characters()
    {
        return $this->hasMany(Character::class);
    }

    public function locations()
    {
        return $this->hasMany(Location::class);
    }

    public function items()
    {
        return $this->hasMany(Item::class);
    }

    public function notes()
    {
        return $this->hasMany(Note::class);
    }

    public function relationships()
    {
        return $this->hasMany(Relationship::class);
    }

    public function timelineEvents()
    {
        return $this->hasMany(TimelineEvent::class);
    }
}