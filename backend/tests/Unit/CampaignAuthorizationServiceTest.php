<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Models\Campaign;
use App\Controllers\DiceRoll;
use App\Controllers\DiceTemplate;
use App\Services\CampaignAuthorizationService;
use Illuminate\Database\Capsule\Manager as Capsule;
use PHPUnit\Framework\TestCase;

final class CampaignAuthorizationServiceTest extends TestCase
{
    private static Capsule $capsule;

    public static function setUpBeforeClass(): void
    {
        parent::setUpBeforeClass();

        if (!in_array('sqlite', \PDO::getAvailableDrivers(), true)) {
            self::markTestSkipped('SQLite PDO driver is not available in this environment.');
        }

        self::$capsule = new Capsule();
        self::$capsule->addConnection([
            'driver' => 'sqlite',
            'database' => ':memory:',
        ]);
        self::$capsule->setAsGlobal();
        self::$capsule->bootEloquent();
        self::$capsule->getConnection()->getSchemaBuilder()->create('campaigns', static function ($table): void {
            $table->string('id')->primary();
            $table->string('user_id');
            $table->string('name');
            $table->text('description')->nullable();
            $table->timestamps();
        });
        self::$capsule->getConnection()->getSchemaBuilder()->create('dice_rolls', static function ($table): void {
            $table->id();
            $table->string('campaign_id');
        });
        self::$capsule->getConnection()->getSchemaBuilder()->create('dice_templates', static function ($table): void {
            $table->id();
            $table->string('campaign_id');
        });
    }

    protected function setUp(): void
    {
        parent::setUp();
        Campaign::query()->delete();
        Campaign::query()->insert([
            ['id' => 'campaign-owner-a', 'user_id' => 'user-a', 'name' => 'A', 'created_at' => now(), 'updated_at' => now()],
            ['id' => 'campaign-owner-b', 'user_id' => 'user-b', 'name' => 'B', 'created_at' => now(), 'updated_at' => now()],
        ]);
        DiceRoll::query()->delete();
        DiceTemplate::query()->delete();
    }

    public function testCampaignLookupIsOwnerScoped(): void
    {
        self::assertNotNull(CampaignAuthorizationService::findOwnedCampaign('campaign-owner-a', 'user-a'));
        self::assertNull(CampaignAuthorizationService::findOwnedCampaign('campaign-owner-a', 'user-b'));
    }

    public function testCampaignRoutesCannotBeUsedAcrossUsers(): void
    {
        self::assertTrue(CampaignAuthorizationService::authorizesPath('/campaign_chronicle/api/campaigns/campaign-owner-a', 'user-a'));
        self::assertFalse(CampaignAuthorizationService::authorizesPath('/campaign_chronicle/api/campaigns/campaign-owner-a/export', 'user-b'));
    }

    public function testNestedDiceResourcesRequireTheRouteCampaign(): void
    {
        $rollA = DiceRoll::query()->create(['campaign_id' => 'campaign-owner-a']);
        $templateB = DiceTemplate::query()->create(['campaign_id' => 'campaign-owner-b']);

        self::assertNotNull(CampaignAuthorizationService::findOwnedEntityInCampaign(
            DiceRoll::class,
            $rollA->getKey(),
            'campaign-owner-a',
            'user-a'
        ));
        self::assertNull(CampaignAuthorizationService::findOwnedEntityInCampaign(
            DiceRoll::class,
            $rollA->getKey(),
            'campaign-owner-b',
            'user-a'
        ));
        self::assertNull(CampaignAuthorizationService::findOwnedEntityInCampaign(
            DiceTemplate::class,
            $templateB->getKey(),
            'campaign-owner-a',
            'user-a'
        ));
    }
}
