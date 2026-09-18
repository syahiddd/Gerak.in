<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Resend, Postmark, AWS, and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'exercisedb' => [
        'base_url' => env('EXERCISEDB_BASE_URL', 'https://edb-with-videos-and-images-by-ascendapi.p.rapidapi.com'),
        'key' => env('EXERCISEDB_API_KEY'),
        'host' => env('EXERCISEDB_HOST', 'edb-with-videos-and-images-by-ascendapi.p.rapidapi.com'),
        'timeout' => (int) env('EXERCISEDB_TIMEOUT', 15),
        'cache_ttl' => (int) env('EXERCISEDB_CACHE_TTL', 86400),
    ],

];
