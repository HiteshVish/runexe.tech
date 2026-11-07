<?php
/**
 * GST lookup configuration.
 *
 * Copy this file to gst-config.php (which is git-ignored and blocked from the
 * web) and fill in your provider's details. The API key never reaches the
 * browser: gst-lookup.php calls the provider from the server.
 *
 * Defaults are set up for the RapidAPI "GST Verification API" provider; only
 * 'enabled' and 'api_key' need changing for it.
 */
return [
    'enabled'   => false,

    // {gstin} is replaced with the GSTIN being looked up.
    'endpoint'  => 'https://gst-verification-api-get-profile-returns-data.p.rapidapi.com/v1/gstin/{gstin}/details',
    'method'    => 'GET',

    // How the key is sent: as a header, a query parameter, or both left blank.
    'api_key'      => '',
    'auth_header'  => 'x-rapidapi-key',  // e.g. 'Authorization', 'x-api-key'; '' to skip
    'auth_prefix'  => '',                // e.g. 'Bearer ', or '' for a raw key
    'auth_query'   => '',                // e.g. 'apikey' to send ?apikey=KEY instead
    'extra_headers' => [
        'x-rapidapi-host: gst-verification-api-get-profile-returns-data.p.rapidapi.com',
    ],

    'timeout'             => 12,              // seconds
    'cache_ttl'           => 30 * 86400,      // GST registrations rarely change; saves quota
    'rate_limit_per_hour' => 10,              // provider calls per visitor IP
    'daily_limit'         => 15,              // provider calls per day in total (0 = no limit)

    // Dot-paths into the provider's JSON response.
    'map' => [
        'success'                  => '',     // optional path that must be truthy, e.g. 'flag'
        'legal_name'               => 'data.legal_name',
        'trade_name'               => 'data.trade_name',
        'status'                   => 'data.status',
        'type'                     => 'data.type',
        'constitution'             => 'data.business_constitution',
        'registration_date'        => 'data.registration_date',
        'cancellation_date'        => 'data.cancellation_date',
        // String, or an object with door_num/floor_num/building_name/street/location/
        // city/district/state/pin_code (or the portal's bno/flno/bnm/st/loc/dst/stcd/pncd).
        'address'                  => 'data.place_of_business_principal.address',
        'additional_addresses'     => 'data.place_of_business_additional',
        'additional_address_field' => 'address',
    ],
];
