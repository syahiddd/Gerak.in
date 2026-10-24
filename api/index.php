<?php

/*
 * Vercel entry point. Vercel only runs PHP inside /api serverless functions
 * (via the community `vercel-php` runtime), so every non-static request is
 * routed here (see vercel.json) and handed to Laravel's normal front controller.
 */

require __DIR__.'/../public/index.php';
