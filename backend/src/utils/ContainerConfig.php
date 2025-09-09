<?php

namespace App\Utils;

use DI\Container;
use DI\ContainerBuilder;

class ContainerConfig
{
    public static function createContainer(): Container
    {
        $containerBuilder = new ContainerBuilder();
        
        // Add container definitions here if needed
        $containerBuilder->addDefinitions([
            // Add any DI definitions here
        ]);
        
        return $containerBuilder->build();
    }
}