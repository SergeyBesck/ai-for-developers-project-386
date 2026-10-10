<?php
declare(strict_types=1);

require __DIR__ . '/../vendor/autoload.php';

use App\Health;

header('Content-Type: application/json; charset=utf-8');
echo json_encode(Health::check(), JSON_UNESCAPED_UNICODE);