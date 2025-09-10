<?php

require_once __DIR__ . '/vendor/autoload.php';

use Illuminate\Database\Capsule\Manager as Capsule;
use Illuminate\Database\Schema\Blueprint;
use Dotenv\Dotenv;

// Load environment variables
$dotenv = Dotenv::createImmutable(__DIR__);
$dotenv->safeLoad();

// Initialize database connection
$capsule = new Capsule;
$capsule->addConnection([
    'driver' => 'mysql',
    'host' => $_ENV['DB_HOST'] ?? 'localhost',
    'port' => $_ENV['DB_PORT'] ?? '3306',
    'database' => $_ENV['DB_NAME'] ?? 'campaign_chronicle',
    'username' => $_ENV['DB_USER'] ?? 'root',
    'password' => $_ENV['DB_PASSWORD'] ?? '',
    'charset' => 'utf8mb4',
    'collation' => 'utf8mb4_unicode_ci',
    'prefix' => '',
]);

$capsule->setAsGlobal();
$capsule->bootEloquent();

echo "Starting Campaign Chronicle authentication migration...\n";

try {
    // Add user_id columns to existing tables
    $tables = ['campaigns', 'characters', 'locations', 'items', 'notes', 'relationships', 'timeline_events'];
    
    foreach ($tables as $table) {
        if (Capsule::schema()->hasTable($table)) {
            if (!Capsule::schema()->hasColumn($table, 'user_id')) {
                echo "Adding user_id to {$table} table...\n";
                
                Capsule::schema()->table($table, function (Blueprint $table) {
                    $table->unsignedBigInteger('user_id')->nullable()->after('id');
                    $table->index('user_id');
                });
                
                echo "✓ Added user_id column to {$table}\n";
            } else {
                echo "✓ {$table} already has user_id column\n";
            }
        } else {
            echo "⚠️  Table {$table} does not exist, skipping...\n";
        }
    }
    
    // Set default user_id for existing records (assuming admin user ID 1)
    echo "\nSetting default user_id for existing records...\n";
    
    foreach ($tables as $table) {
        if (Capsule::schema()->hasTable($table) && Capsule::schema()->hasColumn($table, 'user_id')) {
            $updated = Capsule::table($table)
                ->whereNull('user_id')
                ->update(['user_id' => 1]);
                
            echo "✓ Updated {$updated} records in {$table}\n";
        }
    }
    
    // Make user_id non-nullable after setting defaults
    echo "\nMaking user_id columns non-nullable...\n";
    
    foreach ($tables as $table) {
        if (Capsule::schema()->hasTable($table) && Capsule::schema()->hasColumn($table, 'user_id')) {
            Capsule::schema()->table($table, function (Blueprint $table) {
                $table->unsignedBigInteger('user_id')->nullable(false)->change();
            });
            echo "✓ Made user_id non-nullable in {$table}\n";
        }
    }
    
    echo "\n✅ Migration completed successfully!\n";
    echo "All tables now have user_id foreign keys and existing data has been assigned to user ID 1.\n";
    echo "Note: Make sure the frontpage auth service has a user with ID 1 for existing data to be accessible.\n";
    
} catch (Exception $e) {
    echo "❌ Migration failed: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n";
    exit(1);
}