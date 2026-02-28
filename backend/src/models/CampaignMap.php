<?php

namespace App\Models;

use App\Utils\Uuid;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CampaignMap extends BaseModel
{
    protected $table = 'campaign_maps';

    protected $fillable = [
        'user_id',
        'campaign_id',
        'name',
        'description',
        'image_path',
        'image_url',
        'width',
        'height',
        'pins',
        'routes',
    ];

    protected $casts = [
        'pins' => 'array',
        'routes' => 'array',
        'width' => 'integer',
        'height' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Ensure table exists for environments that were bootstrapped before map support.
     */
    public static function ensureTableExists(): void
    {
        if (Schema::hasTable('campaign_maps')) {
            return;
        }

        Schema::create('campaign_maps', function (Blueprint $table) {
            $table->string('id', 36)->primary();
            $table->string('user_id', 36);
            $table->string('campaign_id', 36);
            $table->string('name');
            $table->text('description')->nullable();
            $table->text('image_path')->nullable();
            $table->text('image_url')->nullable();
            $table->integer('width')->nullable();
            $table->integer('height')->nullable();
            $table->json('pins')->nullable();
            $table->json('routes')->nullable();
            $table->timestamps();

            $table->index('user_id');
            $table->index('campaign_id');
            $table->index(['campaign_id', 'user_id']);
        });
    }

    /**
     * Get the user that owns the map.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the campaign that owns the map.
     */
    public function campaign()
    {
        return $this->belongsTo(Campaign::class);
    }

    /**
     * Get locations linked to this map's pins.
     */
    public function linkedLocations()
    {
        $locationIds = collect($this->pins ?? [])
            ->filter(fn($pin) => isset($pin['locationId']))
            ->pluck('locationId')
            ->filter()
            ->unique();

        if ($locationIds->isEmpty()) {
            return collect();
        }

        return Location::whereIn('id', $locationIds->toArray())->get();
    }

    /**
     * Add a pin to the map.
     */
    public function addPin(array $pinData)
    {
        $pins = $this->pins ?? [];
        $pinData['id'] = Uuid::v4();
        $pins[] = $pinData;
        $this->pins = $pins;
        return $this;
    }

    /**
     * Update a pin on the map.
     */
    public function updatePin(string $pinId, array $pinData)
    {
        $pins = $this->pins ?? [];
        foreach ($pins as $index => $pin) {
            if ($pin['id'] === $pinId) {
                $pins[$index] = array_merge($pin, $pinData);
                break;
            }
        }
        $this->pins = $pins;
        return $this;
    }

    /**
     * Remove a pin from the map.
     */
    public function removePin(string $pinId)
    {
        $pins = $this->pins ?? [];
        $this->pins = array_values(array_filter($pins, fn($pin) => $pin['id'] !== $pinId));
        return $this;
    }

    /**
     * Add a route to the map.
     */
    public function addRoute(array $routeData)
    {
        $routes = $this->routes ?? [];
        $routeData['id'] = Uuid::v4();
        $routes[] = $routeData;
        $this->routes = $routes;
        return $this;
    }

    /**
     * Update a route on the map.
     */
    public function updateRoute(string $routeId, array $routeData)
    {
        $routes = $this->routes ?? [];
        foreach ($routes as $index => $route) {
            if ($route['id'] === $routeId) {
                $routes[$index] = array_merge($route, $routeData);
                break;
            }
        }
        $this->routes = $routes;
        return $this;
    }

    /**
     * Remove a route from the map.
     */
    public function removeRoute(string $routeId)
    {
        $routes = $this->routes ?? [];
        $this->routes = array_values(array_filter($routes, fn($route) => $route['id'] !== $routeId));
        return $this;
    }

    /**
     * Get the full URL for the map image.
     */
    public function getImageUrlAttribute($value)
    {
        if ($value) {
            return $value;
        }

        if ($this->image_path) {
            // Return URL relative to public directory
            return '/storage/' . $this->image_path;
        }

        return null;
    }

    protected function getSearchableFields()
    {
        return ['name', 'description'];
    }
}
