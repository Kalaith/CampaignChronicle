<?php

declare(strict_types=1);

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;

final class SecurityRoutesTest extends TestCase
{
    public function testDebugRouteIsNotRegistered(): void
    {
        $routes = file_get_contents(__DIR__ . '/../../src/routes.php');

        self::assertIsString($routes);
        self::assertStringNotContainsString("'/debug'", $routes);
        self::assertStringNotContainsString('debug/auth', $routes);
    }

    public function testProtectedCampaignGroupStillRequiresJwt(): void
    {
        $routes = file_get_contents(__DIR__ . '/../../src/routes.php');

        self::assertIsString($routes);
        self::assertStringContainsString("})->add(new \\App\\Middleware\\JwtAuthMiddleware());", $routes);
        self::assertStringContainsString("getAttribute('user_id')", $routes);
    }
}
