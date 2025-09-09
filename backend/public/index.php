<?php

require_once __DIR__ . '/../vendor/autoload.php';

use Slim\Factory\AppFactory;
use Dotenv\Dotenv;
use App\External\DatabaseService;
use App\Utils\ContainerConfig;
use App\Middleware\CorsMiddleware;

// Determine if we're in test mode
$isTestMode = defined('TEST_MODE') && TEST_MODE === true;

// Load environment variables first
$dotenv = Dotenv::createImmutable(__DIR__ . '/..');
$dotenv->safeLoad();

// Add required environment variables
$required_env_vars = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
foreach ($required_env_vars as $var) {
    if (!isset($_ENV[$var])) {
        throw new \RuntimeException("Missing required environment variable: {$var}");
    }
}

// Create DI Container
$container = ContainerConfig::createContainer();

// Initialize database service after environment variables are loaded
$db = DatabaseService::getInstance();

// Initialize Eloquent ORM
$capsule = new \Illuminate\Database\Capsule\Manager();
$capsule->addConnection([
    'driver' => 'mysql',
    'host' => $_ENV['DB_HOST'],
    'port' => $_ENV['DB_PORT'],
    'database' => $_ENV['DB_NAME'],
    'username' => $_ENV['DB_USER'],
    'password' => $_ENV['DB_PASSWORD'],
    'charset' => 'utf8mb4',
    'collation' => 'utf8mb4_unicode_ci',
    'prefix' => '',
]);

// Make this Capsule instance available globally
$capsule->setAsGlobal();

// Setup the Eloquent ORM
$capsule->bootEloquent();

// Create app with DI container
AppFactory::setContainer($container);
global $app;
$app = AppFactory::create();

// Set base path for subdirectory deployment (preview environment)
if (isset($_ENV['APP_ENV']) && $_ENV['APP_ENV'] === 'preview') {
    $app->setBasePath('/blacksmith_forge');
}

// Add middleware
$app->add(new CorsMiddleware());
$app->addRoutingMiddleware();
$app->addBodyParsingMiddleware();

// Custom error handling
$errorMiddleware = $app->addErrorMiddleware(true, true, true);
$errorHandler = $errorMiddleware->getDefaultErrorHandler();
$errorHandler->forceContentType('application/json');

// Set custom error renderer
$errorHandler->registerErrorRenderer('application/json', function ($exception, $displayErrorDetails) {
    $error = [
        'success' => false,
        'message' => $exception->getMessage()
    ];
    
    if ($displayErrorDetails) {
        $error['details'] = [
            'type' => get_class($exception),
            'code' => $exception->getCode(),
            'file' => $exception->getFile(),
            'line' => $exception->getLine(),
            'trace' => $exception->getTraceAsString()
        ];
    }
    
    return json_encode($error, JSON_PRETTY_PRINT);
});

// Load routes
$routes = require_once __DIR__ . '/../src/routes.php';
$routes($app);

// Run app
$app->run();
