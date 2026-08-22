<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Campaign;
use App\Models\CampaignMap;
use App\Models\Character;
use App\Models\CombatEncounter;
use App\Models\Item;
use App\Models\Location;
use App\Models\Note;
use App\Models\Quest;
use App\Models\Relationship;
use App\Models\SharedResource;
use App\Models\TimelineEvent;
use Illuminate\Database\Eloquent\Model;

/**
 * Single ownership boundary for authenticated campaign requests.
 *
 * Resource IDs are intentionally resolved through their campaign owner instead
 * of being looked up globally and checked after the fact.
 */
final class CampaignAuthorizationService
{
    /**
     * Resolve a campaign only when it belongs to the authenticated user.
     */
    public static function findOwnedCampaign(string $campaignId, string $userId): ?Campaign
    {
        return Campaign::query()
            ->whereKey($campaignId)
            ->where('user_id', $userId)
            ->first();
    }

    /**
     * Resolve a campaign child only when its parent campaign belongs to the user.
     *
     * @param class-string<Model> $modelClass
     */
    public static function findOwnedEntity(string $modelClass, string|int $entityId, string $userId): ?Model
    {
        return $modelClass::query()
            ->whereKey($entityId)
            ->whereHas('campaign', static function ($query) use ($userId): void {
                $query->where('user_id', $userId);
            })
            ->first();
    }

    /**
     * Resolve a nested campaign child only when both route identifiers agree.
     * This prevents an owned campaign URL from being combined with another
     * campaign's child identifier.
     *
     * @param class-string<Model> $modelClass
     */
    public static function findOwnedEntityInCampaign(
        string $modelClass,
        string|int $entityId,
        string|int $campaignId,
        string $userId
    ): ?Model {
        return $modelClass::query()
            ->whereKey($entityId)
            ->where('campaign_id', $campaignId)
            ->whereHas('campaign', static function ($query) use ($userId, $campaignId): void {
                $query->whereKey($campaignId)->where('user_id', $userId);
            })
            ->first();
    }

    /**
     * Authorize the resource encoded by an authenticated API path.
     *
     * Nested resources are authorized by campaign_id. Standalone child routes
     * are authorized by their own campaign relationship.
     */
    public static function authorizesPath(string $path, string $userId): bool
    {
        $segments = array_values(array_filter(explode('/', trim($path, '/')), static fn (string $segment): bool => $segment !== ''));
        $apiIndex = array_search('api', $segments, true);
        if ($apiIndex === false) {
            return true;
        }

        $segments = array_slice($segments, $apiIndex + 1);
        if ($segments === []) {
            return true;
        }

        if ($segments[0] === 'campaigns' && isset($segments[1])) {
            return self::findOwnedCampaign($segments[1], $userId) !== null;
        }

        $entityClasses = [
            'characters' => Character::class,
            'locations' => Location::class,
            'items' => Item::class,
            'notes' => Note::class,
            'relationships' => Relationship::class,
            'timeline' => TimelineEvent::class,
            'maps' => CampaignMap::class,
            'quests' => Quest::class,
            'resources' => SharedResource::class,
            'combat' => CombatEncounter::class,
        ];

        if (isset($entityClasses[$segments[0]], $segments[1])) {
            return self::findOwnedEntity($entityClasses[$segments[0]], $segments[1], $userId) !== null;
        }

        return true;
    }
}
