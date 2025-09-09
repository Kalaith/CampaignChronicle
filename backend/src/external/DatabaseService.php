<?php

namespace App\External;

use Illuminate\Database\Capsule\Manager as Capsule;

class DatabaseService
{
    private static ?DatabaseService $instance = null;
    private $pdo;

    private function __construct()
    {
        $this->loadEnvironmentFile();
        $configPath = __DIR__ . '/../../config/database.php';
        if (file_exists($configPath)) {
            $config = require $configPath;
            $db = $config['database'];
        } else {
            $db = [
                'driver' => 'mysql',
                'host' => $_ENV['DB_HOST'] ?? 'localhost',
                'port' => $_ENV['DB_PORT'] ?? 3306,
                'database' => $_ENV['DB_NAME'] ?? $_ENV['DB_DATABASE'] ?? 'blacksmith_forge',
                'username' => $_ENV['DB_USER'] ?? $_ENV['DB_USERNAME'] ?? 'root',
                'password' => $_ENV['DB_PASSWORD'] ?? '',
                'charset' => 'utf8mb4',
            ];
        }

        switch ($db['driver']) {
            case 'mysql':
                $dsn = sprintf(
                    'mysql:host=%s;port=%d;dbname=%s;charset=%s',
                    $db['host'],
                    $db['port'],
                    $db['database'],
                    $db['charset']
                );
                break;
            case 'sqlite':
                $dbPath = $db['database'] ?? __DIR__ . '/../../storage/database.sqlite';
                $storageDir = dirname($dbPath);
                if (!is_dir($storageDir)) {
                    mkdir($storageDir, 0755, true);
                }
                $dsn = "sqlite:" . $dbPath;
                break;
            default:
                throw new \Exception("Unsupported database driver: {$db['driver']}");
        }

        $options = [
            \PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION,
            \PDO::ATTR_DEFAULT_FETCH_MODE => \PDO::FETCH_ASSOC,
            \PDO::ATTR_EMULATE_PREPARES => false,
        ];

        try {
            $this->pdo = new \PDO(
                $dsn,
                $db['username'] ?? null,
                $db['password'] ?? null,
                $options
            );
            if ($db['driver'] === 'mysql') {
                $this->pdo->exec("SET NAMES {$db['charset']}");
            }
        } catch (\PDOException $e) {
            throw new \Exception("Connection failed: " . $e->getMessage());
        }
    }

    public static function getInstance(): self
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function getPdo()
    {
        return $this->pdo;
    }

    private function loadEnvironmentFile(): void
    {
        $envPath = __DIR__ . '/../../.env';
        if (!file_exists($envPath)) {
            return;
        }
        $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            if (strpos(trim($line), '#') === 0) {
                continue;
            }
            if (strpos($line, '=') !== false) {
                list($key, $value) = explode('=', $line, 2);
                $key = trim($key);
                $value = trim($value);
                $value = trim($value, "\"'");
                if (!isset($_ENV[$key])) {
                    $_ENV[$key] = $value;
                    putenv("{$key}={$value}");
                }
            }
        }
    }

    public function testConnection()
    {
        try {
            $stmt = $this->pdo->query("SELECT 1");
            return $stmt !== false;
        } catch (\PDOException $e) {
            return false;
        }
    }

    // Prevent cloning and unserialization
    private function __clone() {}
    public function __wakeup() {}
}
