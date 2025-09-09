<?php

require_once __DIR__ . '/vendor/autoload.php';

use Dotenv\Dotenv;

// Load environment variables
$dotenv = Dotenv::createImmutable(__DIR__);
$dotenv->safeLoad();

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

$capsule->setAsGlobal();
$capsule->bootEloquent();

echo "Creating database tables...\n";

try {
    // Read and execute the schema.sql file
    $schema = file_get_contents(__DIR__ . '/database/schema.sql');
    
    // Split by semicolon and execute each statement
    $statements = array_filter(array_map('trim', explode(';', $schema)));
    
    foreach ($statements as $statement) {
        if (!empty($statement)) {
            echo "Executing: " . substr($statement, 0, 50) . "...\n";
            \Illuminate\Database\Capsule\Manager::statement($statement);
        }
    }
    
    echo "\n✅ Database tables created successfully!\n";
    echo "You can now use the Campaign Chronicle backend API.\n\n";
    
    // Test the connection by creating a sample campaign
    echo "Creating sample campaign...\n";
    
    $campaign = new \App\Models\Campaign();
    $campaign->name = 'Sample Campaign';
    $campaign->description = 'A sample D&D campaign to test the system';
    $campaign->save();
    
    echo "✅ Sample campaign created with ID: " . $campaign->id . "\n";
    echo "Backend is ready to use!\n";
    
} catch (Exception $e) {
    echo "\n❌ Error creating database tables: " . $e->getMessage() . "\n";
    exit(1);
}