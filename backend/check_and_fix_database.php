<?php
require_once 'vendor/autoload.php';

// Load environment variables
$dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
$dotenv->load();

try {
    $pdo = new PDO(
        'mysql:host=' . $_ENV['DB_HOST'] . ';dbname=' . $_ENV['DB_NAME'],
        $_ENV['DB_USER'],
        $_ENV['DB_PASSWORD'],
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    
    echo "=== Current campaigns table structure ===\n";
    $stmt = $pdo->query('DESCRIBE campaigns');
    $columns = [];
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $columns[$row['Field']] = $row;
        echo sprintf("  %-15s %-20s %-8s %-5s %-15s %s\n", 
            $row['Field'], 
            $row['Type'], 
            $row['Null'], 
            $row['Key'], 
            $row['Default'], 
            $row['Extra']
        );
    }
    
    // Check if user_id field exists and what type it is
    if (!isset($columns['user_id'])) {
        echo "\n❌ user_id field is missing from campaigns table!\n";
        echo "Adding user_id field...\n";
        
        $sql = "ALTER TABLE campaigns ADD COLUMN user_id VARCHAR(36) NOT NULL AFTER id";
        $pdo->exec($sql);
        echo "✅ Added user_id field\n";
        
        // Add foreign key constraint
        $sql = "ALTER TABLE campaigns ADD CONSTRAINT fk_campaigns_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE";
        $pdo->exec($sql);
        echo "✅ Added foreign key constraint\n";
        
        // Add index
        $sql = "ALTER TABLE campaigns ADD INDEX idx_campaigns_user (user_id)";
        $pdo->exec($sql);
        echo "✅ Added index on user_id\n";
        
    } elseif ($columns['user_id']['Type'] !== 'varchar(36)') {
        echo "\n❌ user_id field type is " . $columns['user_id']['Type'] . " but should be varchar(36)\n";
        echo "Fixing user_id field type...\n";
        
        // Check if there are any existing campaigns
        $stmt = $pdo->query('SELECT COUNT(*) as count FROM campaigns');
        $campaignCount = $stmt->fetch(PDO::FETCH_ASSOC)['count'];
        
        if ($campaignCount > 0) {
            echo "⚠️  Found $campaignCount existing campaigns. These will be deleted to fix the schema.\n";
            echo "Deleting existing campaigns...\n";
            $pdo->exec("DELETE FROM campaigns");
            echo "✅ Deleted existing campaigns\n";
        }
        
        // Drop foreign key constraint if it exists
        try {
            $pdo->exec("ALTER TABLE campaigns DROP FOREIGN KEY fk_campaigns_user_id");
            echo "✅ Dropped existing foreign key constraint\n";
        } catch (Exception $e) {
            echo "ℹ️  No existing foreign key constraint to drop\n";
        }
        
        // Drop existing index if it exists
        try {
            $pdo->exec("ALTER TABLE campaigns DROP INDEX idx_campaigns_user");
            echo "✅ Dropped existing index\n";
        } catch (Exception $e) {
            echo "ℹ️  No existing index to drop\n";
        }
        
        // Change column type
        $sql = "ALTER TABLE campaigns MODIFY COLUMN user_id VARCHAR(36) NOT NULL";
        $pdo->exec($sql);
        echo "✅ Changed user_id type to varchar(36)\n";
        
        // Re-add foreign key constraint
        $sql = "ALTER TABLE campaigns ADD CONSTRAINT fk_campaigns_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE";
        $pdo->exec($sql);
        echo "✅ Added foreign key constraint\n";
        
        // Add index
        $sql = "ALTER TABLE campaigns ADD INDEX idx_campaigns_user (user_id)";
        $pdo->exec($sql);
        echo "✅ Added index on user_id\n";
        
    } else {
        echo "\n✅ user_id field is correctly configured as varchar(36)\n";
    }
    
    echo "\n=== Updated campaigns table structure ===\n";
    $stmt = $pdo->query('DESCRIBE campaigns');
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo sprintf("  %-15s %-20s %-8s %-5s %-15s %s\n", 
            $row['Field'], 
            $row['Type'], 
            $row['Null'], 
            $row['Key'], 
            $row['Default'], 
            $row['Extra']
        );
    }
    
    echo "\n✅ Database migration completed successfully!\n";
    
} catch (Exception $e) {
    echo '❌ Error: ' . $e->getMessage() . "\n";
    exit(1);
}
