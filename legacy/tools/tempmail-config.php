<?php
/**
 * Testmail.app credentials — same backend as the old SofftSolution temp mail tool.
 * Fill these, or set TESTMAIL_APIKEY / TESTMAIL_NAMESPACE in the environment.
 */
return [
    'apikey'    => getenv('TESTMAIL_APIKEY') ?: '83ed6aa4-147d-4fc0-8914-f997b3d793e2',
    'namespace' => getenv('TESTMAIL_NAMESPACE') ?: 'fi3jx',
];
