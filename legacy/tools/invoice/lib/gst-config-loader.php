<?php
declare(strict_types=1);

/** Merged GST lookup config; disabled unless gst-config.php exists and enables it. */
function gst_lookup_config(): array
{
    static $config = null;
    if ($config !== null) {
        return $config;
    }
    $defaults = require __DIR__ . '/../gst-config.example.php';
    $file = __DIR__ . '/../gst-config.php';
    $custom = is_file($file) ? require $file : [];
    $config = array_replace($defaults, is_array($custom) ? $custom : []);
    $config['map'] = array_replace($defaults['map'], $custom['map'] ?? []);
    $config['enabled'] = !empty($config['enabled']) && $config['endpoint'] !== '' && !str_contains($config['endpoint'], 'example.com');
    return $config;
}
